from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Asset,
    AuditLog,
    Company,
    Customer,
    Part,
    ServiceReport,
    Site,
    Technician,
    TimeEntry,
    WorkOrder,
    WorkOrderPart,
)
from .permissions import IsManagement
from .serializers import (
    AssetSerializer,
    CompanySerializer,
    CustomerSerializer,
    PartSerializer,
    ServiceReportSerializer,
    SiteSerializer,
    TechnicianSerializer,
    TimeEntrySerializer,
    WorkOrderPartSerializer,
    WorkOrderSerializer,
)
from .services import perform_transition


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("company").all()
    serializer_class = CustomerSerializer
    filterset_fields = ["company"]
    search_fields = ["name", "email", "phone"]

    @action(detail=True)
    def sites(self, request, pk=None):
        customer = self.get_object()
        serializer = SiteSerializer(customer.sites.all(), many=True)
        return Response(serializer.data)


class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.select_related("customer").all()
    serializer_class = SiteSerializer
    filterset_fields = ["customer"]
    search_fields = ["name", "address"]

    @action(detail=True)
    def assets(self, request, pk=None):
        site = self.get_object()
        serializer = AssetSerializer(site.assets.all(), many=True)
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("site").all()
    serializer_class = AssetSerializer
    filterset_fields = ["site", "status"]
    search_fields = ["name", "serial_number", "asset_type"]


class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.select_related("user").all()
    serializer_class = TechnicianSerializer
    filterset_fields = ["is_active", "specialty"]
    search_fields = ["user__username", "user__first_name", "user__last_name", "specialty"]


class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.all()
    serializer_class = PartSerializer
    search_fields = ["sku", "name"]


class WorkOrderPartViewSet(viewsets.ModelViewSet):
    queryset = WorkOrderPart.objects.select_related("part", "work_order").all()
    serializer_class = WorkOrderPartSerializer
    filterset_fields = ["work_order"]


class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.select_related("work_order", "technician").all()
    serializer_class = TimeEntrySerializer
    filterset_fields = ["work_order", "technician"]


class ServiceReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceReport.objects.select_related("work_order").all()
    serializer_class = ServiceReportSerializer
    filterset_fields = ["work_order"]


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        WorkOrder.objects.select_related("customer", "site", "asset", "assigned_technician")
        .prefetch_related("parts", "parts__part", "time_entries", "files", "audit_logs")
        .all()
    )
    serializer_class = WorkOrderSerializer
    filterset_fields = ["status", "priority", "assigned_technician", "site", "customer"]
    search_fields = ["number", "title", "description", "customer__name"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.is_technician:
            qs = qs.filter(assigned_technician__user=user)
        elif user.is_authenticated and user.role == "customer":
            qs = qs.filter(customer__user=user)
        return qs

    def _transition(self, request, pk, target):
        work_order = self.get_object()
        instance = perform_transition(work_order, target, user=request.user)
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"], permission_classes=[IsManagement])
    def assign(self, request, pk=None):
        work_order = self.get_object()
        technician_id = request.data.get("technician")
        if not technician_id:
            return Response({"detail": "technician is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            work_order.assigned_technician = Technician.objects.get(pk=technician_id)
        except Technician.DoesNotExist:
            return Response({"detail": "technician not found."}, status=status.HTTP_400_BAD_REQUEST)
        instance = perform_transition(work_order, WorkOrder.Status.ASSIGNED, user=request.user)
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        return self._transition(request, pk, WorkOrder.Status.ACCEPTED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        return self._transition(request, pk, WorkOrder.Status.IN_PROGRESS)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        work_order = self.get_object()
        instance = perform_transition(work_order, WorkOrder.Status.COMPLETED, user=request.user)
        report_data = request.data
        if report_data:
            serializer = ServiceReportSerializer(data={**report_data, "work_order": work_order.id})
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"], permission_classes=[IsManagement])
    def reopen(self, request, pk=None):
        return self._transition(request, pk, WorkOrder.Status.NEW)


class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False)
    def stats(self, request):
        open_count = WorkOrder.objects.filter(
            status__in=[
                WorkOrder.Status.NEW,
                WorkOrder.Status.ASSIGNED,
                WorkOrder.Status.ACCEPTED,
                WorkOrder.Status.IN_PROGRESS,
            ]
        ).count()
        in_progress = WorkOrder.objects.filter(status=WorkOrder.Status.IN_PROGRESS).count()
        completed = WorkOrder.objects.filter(status=WorkOrder.Status.COMPLETED).count()
        technician_count = Technician.objects.filter(is_active=True).count()
        overdue = WorkOrder.objects.filter(
            status__in=[
                WorkOrder.Status.NEW,
                WorkOrder.Status.ASSIGNED,
                WorkOrder.Status.ACCEPTED,
                WorkOrder.Status.IN_PROGRESS,
            ],
            due_at__isnull=False,
        ).filter(due_at__lt=timezone.now()).count()
        return Response(
            {
                "open_tickets": open_count,
                "in_progress": in_progress,
                "completed": completed,
                "technicians": technician_count,
                "overdue": overdue,
            }
        )

    @action(detail=False)
    def workload(self, request):
        rows = (
            WorkOrder.objects.exclude(
                status__in=[WorkOrder.Status.COMPLETED, WorkOrder.Status.CANCELLED]
            )
            .values("assigned_technician__user__first_name", "assigned_technician__user__last_name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response(
            [
                {
                    "technician": f"{row['assigned_technician__user__first_name']} {row['assigned_technician__user__last_name']}".strip(),
                    "count": row["count"],
                }
                for row in rows
            ]
        )

    @action(detail=False)
    def sla(self, request):
        overdue = WorkOrder.objects.filter(
            status__in=[
                WorkOrder.Status.NEW,
                WorkOrder.Status.ASSIGNED,
                WorkOrder.Status.ACCEPTED,
                WorkOrder.Status.IN_PROGRESS,
            ],
            due_at__isnull=False,
        ).filter(
            due_at__lt=timezone.now()
        )
        total_open = WorkOrder.objects.filter(
            status__in=[
                WorkOrder.Status.NEW,
                WorkOrder.Status.ASSIGNED,
                WorkOrder.Status.ACCEPTED,
                WorkOrder.Status.IN_PROGRESS,
            ]
        ).count()
        return Response(
            {
                "breaches": overdue.count(),
                "open_orders": total_open,
                "on_time": max(0, total_open - overdue.count()),
            }
        )

    @action(detail=False)
    def avg_resolution(self, request):
        agg = WorkOrder.objects.filter(status=WorkOrder.Status.COMPLETED).aggregate(
            avg=Avg("resolution_minutes")
        )
        return Response({"avg_resolution_minutes": agg["avg"]})

    @action(detail=False)
    def parts_consumption(self, request):
        rows = (
            WorkOrderPart.objects.values("part__name", "part__sku")
            .annotate(total_qty=Sum("quantity"))
            .order_by("-total_qty")
        )
        return Response(
            [
                {"part": row["part__name"], "sku": row["part__sku"], "quantity": row["total_qty"]}
                for row in rows
            ]
        )

    @action(detail=False)
    def over_time(self, request):
        rows = (
            WorkOrder.objects.exclude(status__in=[WorkOrder.Status.NEW])
            .values("status")
            .annotate(count=Count("id"))
        )
        return Response([{"status": row["status"], "count": row["count"]} for row in rows])

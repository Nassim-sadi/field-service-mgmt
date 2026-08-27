from rest_framework import serializers

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
    WorkOrderFile,
    WorkOrderPart,
)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name", "contact_name", "contact_email", "contact_phone", "address"]


class CustomerSerializer(serializers.ModelSerializer):
    site_count = serializers.IntegerField(source="sites.count", read_only=True)
    user = serializers.PrimaryKeyRelatedField(
        read_only=True, default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Customer
        fields = ["id", "company", "name", "email", "phone", "address", "user", "site_count", "created_at"]


class SiteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    asset_count = serializers.IntegerField(source="assets.count", read_only=True)

    class Meta:
        model = Site
        fields = [
            "id",
            "customer",
            "customer_name",
            "name",
            "address",
            "latitude",
            "longitude",
            "contact_name",
            "contact_phone",
            "asset_count",
        ]


class AssetSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source="site.name", read_only=True)

    class Meta:
        model = Asset
        fields = ["id", "site", "site_name", "name", "asset_type", "serial_number", "status"]


class TechnicianSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    open_work_orders = serializers.SerializerMethodField()

    class Meta:
        model = Technician
        fields = [
            "id",
            "user",
            "username",
            "full_name",
            "specialty",
            "hourly_rate",
            "is_active",
            "latitude",
            "longitude",
            "open_work_orders",
        ]

    def get_open_work_orders(self, obj):
        return obj.work_orders.exclude(
            status__in=[WorkOrder.Status.COMPLETED, WorkOrder.Status.CANCELLED]
        ).count()


class PartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = ["id", "sku", "name", "description", "stock_qty", "unit_price", "created_at"]


class WorkOrderPartSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source="part.name", read_only=True)
    part_sku = serializers.CharField(source="part.sku", read_only=True)

    class Meta:
        model = WorkOrderPart
        fields = ["id", "part", "part_name", "part_sku", "quantity", "unit_price", "line_total"]
        read_only_fields = ["unit_price", "line_total"]

    def create(self, validated_data):
        part = validated_data["part"]
        validated_data["unit_price"] = part.unit_price
        instance = super().create(validated_data)
        part.stock_qty = max(0, part.stock_qty - validated_data["quantity"])
        part.save(update_fields=["stock_qty"])
        return instance


class TimeEntrySerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source="technician.user.get_full_name", read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "work_order",
            "technician",
            "technician_name",
            "started_at",
            "ended_at",
            "duration_minutes",
        ]


class WorkOrderFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.username", read_only=True)

    class Meta:
        model = WorkOrderFile
        fields = ["id", "work_order", "file", "name", "uploaded_by", "uploaded_by_name", "created_at"]
        read_only_fields = ["uploaded_by"]


class ServiceReportSerializer(serializers.ModelSerializer):
    work_order_number = serializers.CharField(source="work_order.number", read_only=True)

    class Meta:
        model = ServiceReport
        fields = [
            "id",
            "work_order",
            "work_order_number",
            "diagnosis",
            "resolution",
            "labor_hours",
            "customer_confirmation",
            "signature",
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "from_status", "to_status", "user_name", "note", "created_at"]


class WorkOrderNestedSerializer(serializers.ModelSerializer):
    parts = WorkOrderPartSerializer(source="parts.all", many=True, read_only=True)
    time_entries = TimeEntrySerializer(source="time_entries.all", many=True, read_only=True)
    files = WorkOrderFileSerializer(source="files.all", many=True, read_only=True)
    service_report = ServiceReportSerializer(read_only=True)
    audit_logs = AuditLogSerializer(source="audit_logs.all", many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "number",
            "title",
            "description",
            "priority",
            "status",
            "open_date",
            "due_at",
            "completed_at",
            "resolution_minutes",
            "is_overdue",
            "available_transitions",
            "parts",
            "time_entries",
            "files",
            "service_report",
            "audit_logs",
        ]


class WorkOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    site_name = serializers.CharField(source="site.name", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    assigned_technician_name = serializers.CharField(
        source="assigned_technician.user.get_full_name", read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    available_transitions = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "number",
            "customer",
            "customer_name",
            "site",
            "site_name",
            "asset",
            "asset_name",
            "assigned_technician",
            "assigned_technician_name",
            "title",
            "description",
            "priority",
            "status",
            "open_date",
            "due_at",
            "completed_at",
            "resolution_minutes",
            "is_overdue",
            "available_transitions",
        ]
        read_only_fields = ["number", "status"]

    def get_available_transitions(self, obj):
        return obj.available_transitions()

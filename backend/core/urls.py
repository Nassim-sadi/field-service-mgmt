from rest_framework import routers

from .views import (
    AssetViewSet,
    CompanyViewSet,
    CustomerViewSet,
    DashboardViewSet,
    PartViewSet,
    ServiceReportViewSet,
    SiteViewSet,
    TechnicianViewSet,
    TimeEntryViewSet,
    WorkOrderPartViewSet,
    WorkOrderViewSet,
)

router = routers.DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")
router.register("customers", CustomerViewSet, basename="customer")
router.register("sites", SiteViewSet, basename="site")
router.register("assets", AssetViewSet, basename="asset")
router.register("technicians", TechnicianViewSet, basename="technician")
router.register("parts", PartViewSet, basename="part")
router.register("work-orders", WorkOrderViewSet, basename="work-order")
router.register("work-order-parts", WorkOrderPartViewSet, basename="work-order-part")
router.register("time-entries", TimeEntryViewSet, basename="time-entry")
router.register("service-reports", ServiceReportViewSet, basename="service-report")
router.register("dashboard", DashboardViewSet, basename="dashboard")

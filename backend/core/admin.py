from django.contrib import admin

from accounts.models import User
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


class WorkOrderPartInline(admin.TabularInline):
    model = WorkOrderPart
    extra = 0


class SiteInline(admin.TabularInline):
    model = Site
    extra = 0


class CustomerInline(admin.TabularInline):
    model = Customer
    extra = 0


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "company", "email", "phone"]
    search_fields = ["name", "email"]
    list_filter = ["company"]


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ["name", "customer", "contact_name"]
    search_fields = ["name", "address"]


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ["name", "site", "asset_type", "status"]
    list_filter = ["status"]


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ["user", "specialty", "hourly_rate", "is_active"]
    list_filter = ["is_active"]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ["sku", "name", "stock_qty", "unit_price"]
    search_fields = ["sku", "name"]


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "customer", "status", "priority", "assigned_technician", "open_date"]
    list_filter = ["status", "priority"]
    search_fields = ["number", "title"]
    inlines = [WorkOrderPartInline]


@admin.register(ServiceReport)
class ServiceReportAdmin(admin.ModelAdmin):
    list_display = ["work_order", "customer_confirmation", "labor_hours"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["work_order", "from_status", "to_status", "user", "created_at"]


admin.site.register(WorkOrderPart)
admin.site.register(TimeEntry)
admin.site.register(WorkOrderFile)

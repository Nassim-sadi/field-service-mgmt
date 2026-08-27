from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Company(TimeStampedModel):
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Customer(TimeStampedModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="customers")
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_profile"
    )

    def __str__(self):
        return self.name


class Site(TimeStampedModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="sites")
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    contact_name = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return f"{self.name} ({self.customer.name})"


class Asset(TimeStampedModel):
    class Status(models.TextChoices):
        OPERATIONAL = "operational", "Operational"
        UNDER_MAINTENANCE = "under_maintenance", "Under Maintenance"
        OUT_OF_SERVICE = "out_of_service", "Out of Service"

    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="assets")
    name = models.CharField(max_length=200)
    asset_type = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.OPERATIONAL)

    def __str__(self):
        return self.name


class Technician(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="technician_profile")
    specialty = models.CharField(max_length=200, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class Part(TimeStampedModel):
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    stock_qty = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name


class Priority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class WorkOrder(TimeStampedModel):
    class Status(models.TextChoices):
        NEW = "new", "New"
        ASSIGNED = "assigned", "Assigned"
        ACCEPTED = "accepted", "Accepted"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    STATUS_TRANSITIONS = {
        Status.NEW: {Status.ASSIGNED, Status.CANCELLED},
        Status.ASSIGNED: {Status.ACCEPTED, Status.CANCELLED},
        Status.ACCEPTED: {Status.IN_PROGRESS},
        Status.IN_PROGRESS: {Status.COMPLETED},
        Status.COMPLETED: set(),
        Status.CANCELLED: set(),
    }

    number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="work_orders")
    site = models.ForeignKey(Site, on_delete=models.PROTECT, related_name="work_orders")
    asset = models.ForeignKey(
        Asset, on_delete=models.SET_NULL, null=True, blank=True, related_name="work_orders"
    )
    assigned_technician = models.ForeignKey(
        Technician, on_delete=models.SET_NULL, null=True, blank=True, related_name="work_orders"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    open_date = models.DateTimeField(default=timezone.now)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    resolution_minutes = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-open_date"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["assigned_technician"]),
            models.Index(fields=["due_at"]),
        ]

    def __str__(self):
        return f"{self.number} - {self.title}"

    def can_transition(self, target: str) -> bool:
        return target in self.STATUS_TRANSITIONS[self.status]

    def available_transitions(self) -> list[str]:
        return sorted(self.STATUS_TRANSITIONS[self.status])

    def transition_to(self, target: str) -> None:
        if not self.can_transition(target):
            raise ValueError(
                f"Cannot move work order {self.number} from {self.status} to {target}."
            )
        self.status = target
        if target == self.Status.COMPLETED:
            self.completed_at = timezone.now()
            self.resolution_minutes = self._compute_resolution()
        self.save()

    def _compute_resolution(self) -> int:
        if self.completed_at and self.open_date:
            return max(0, int((self.completed_at - self.open_date).total_seconds() // 60))
        return 0

    @property
    def is_overdue(self) -> bool:
        if not self.due_at or self.status in (self.Status.COMPLETED, self.Status.CANCELLED):
            return False
        return timezone.now() > self.due_at

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = self._generate_number()
        super().save(*args, **kwargs)

    def _generate_number(self) -> str:
        import uuid

        return f"WO-{uuid.uuid4().hex[:8].upper()}"


class TimeEntry(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="time_entries")
    technician = models.ForeignKey(Technician, on_delete=models.CASCADE, related_name="time_entries")
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    @property
    def duration_minutes(self) -> int:
        end = self.ended_at or timezone.now()
        return max(0, int((end - self.started_at).total_seconds() // 60))


class WorkOrderPart(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="parts")
    part = models.ForeignKey(Part, on_delete=models.PROTECT, related_name="work_order_usages")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def line_total(self):
        return self.quantity * self.unit_price


class WorkOrderFile(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="work_orders/")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="uploaded_files")
    name = models.CharField(max_length=200, blank=True)


class ServiceReport(TimeStampedModel):
    work_order = models.OneToOneField(WorkOrder, on_delete=models.CASCADE, related_name="service_report")
    diagnosis = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    labor_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    customer_confirmation = models.BooleanField(default=False)
    signature = models.CharField(max_length=200, blank=True)


class AuditLog(TimeStampedModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="audit_logs")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="audit_logs")
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["created_at"]

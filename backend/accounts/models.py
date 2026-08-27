from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    TECHNICIAN = "technician", "Technician"
    CUSTOMER = "customer", "Customer"


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADMIN)

    @property
    def is_management(self) -> bool:
        return self.role in (Role.ADMIN, Role.MANAGER)

    @property
    def is_technician(self) -> bool:
        return self.role == Role.TECHNICIAN

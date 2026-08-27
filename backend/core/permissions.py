from rest_framework.permissions import BasePermission

from accounts.models import Role


class IsManagement(BasePermission):
    message = "Only managers and admins can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_management)


class IsTechnician(BasePermission):
    message = "Only technicians can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_technician)


class IsOwnerCustomer(BasePermission):
    message = "You can only access your own data."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_management:
            return True
        return obj.customer.user_id == request.user.id

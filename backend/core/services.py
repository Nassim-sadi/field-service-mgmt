from rest_framework.exceptions import ValidationError

from .models import AuditLog, WorkOrder


class WorkOrderStateError(ValidationError):
    pass


def perform_transition(work_order: WorkOrder, target: str, user=None, note: str = "") -> WorkOrder:
    if work_order.status == target:
        return work_order
    from_status = work_order.status
    try:
        work_order.transition_to(target)
    except ValueError as exc:
        raise WorkOrderStateError(str(exc)) from exc
    AuditLog.objects.create(
        work_order=work_order,
        from_status=from_status,
        to_status=target,
        user=user,
        note=note,
    )
    return work_order

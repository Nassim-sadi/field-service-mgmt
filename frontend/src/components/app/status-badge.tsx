import { Badge } from '@/components/ui/badge'
import type { AssetStatus, Role, WorkOrderPriority, WorkOrderStatus } from '@/lib/api/types'

const statusStyles: Record<WorkOrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  accepted: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-zinc-200 text-zinc-600',
}

const statusLabels: Record<WorkOrderStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const priorityStyles: Record<WorkOrderPriority, string> = {
  low: 'bg-zinc-100 text-zinc-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const assetStatusStyles: Record<AssetStatus, string> = {
  operational: 'bg-emerald-100 text-emerald-700',
  under_maintenance: 'bg-amber-100 text-amber-700',
  out_of_service: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <Badge variant="secondary" className={statusStyles[status]}>
      {statusLabels[status]}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <Badge variant="secondary" className={priorityStyles[priority]}>
      {priority}
    </Badge>
  )
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="secondary" className={assetStatusStyles[status]}>
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}

const roleStyles: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-amber-100 text-amber-700',
  technician: 'bg-sky-100 text-sky-700',
  customer: 'bg-emerald-100 text-emerald-700',
}

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  technician: 'Technician',
  customer: 'Customer',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="secondary" className={roleStyles[role]}>
      {roleLabels[role]}
    </Badge>
  )
}

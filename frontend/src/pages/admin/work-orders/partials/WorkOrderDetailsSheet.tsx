import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PriorityBadge, StatusBadge } from '@/components/app/status-badge'
import type { WorkOrder } from '@/lib/api/types'

export function WorkOrderDetailsSheet({
  workOrder,
  open,
  onOpenChange,
}: {
  workOrder: WorkOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!workOrder) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {workOrder.number} · {workOrder.title}
          </SheetTitle>
          <SheetDescription>{workOrder.customer_name}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 text-sm">
          <div className="flex gap-2">
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
            {workOrder.is_overdue && (
              <span className="text-sm font-medium text-destructive">Overdue</span>
            )}
          </div>
          <dl className="space-y-3">
            <Row label="Site" value={workOrder.site_name} />
            <Row label="Asset" value={workOrder.asset_name || '—'} />
            <Row label="Technician" value={workOrder.assigned_technician_name || 'Unassigned'} />
            <Row
              label="Opened"
              value={new Date(workOrder.open_date).toLocaleString()}
            />
            <Row
              label="Due"
              value={workOrder.due_at ? new Date(workOrder.due_at).toLocaleString() : '—'}
            />
            {workOrder.completed_at && (
              <Row
                label="Completed"
                value={new Date(workOrder.completed_at).toLocaleString()}
              />
            )}
            {workOrder.resolution_minutes != null && (
              <Row label="Resolution" value={`${workOrder.resolution_minutes} min`} />
            )}
          </dl>
          {workOrder.description && (
            <div className="space-y-1">
              <div className="text-muted-foreground">Description</div>
              <p className="whitespace-pre-wrap">{workOrder.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

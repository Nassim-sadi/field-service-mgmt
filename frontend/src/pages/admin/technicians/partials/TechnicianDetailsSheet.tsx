import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { Technician } from '@/lib/api/types'

export function TechnicianDetailsSheet({
  technician,
  open,
  onOpenChange,
}: {
  technician: Technician | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!technician) return null

  const coords =
    technician.latitude != null && technician.longitude != null
      ? `${technician.latitude}, ${technician.longitude}`
      : '—'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{technician.full_name || technician.username}</SheetTitle>
          <SheetDescription>{technician.username}</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Specialty" value={technician.specialty || '—'} />
          <Row label="Hourly rate" value={`$${technician.hourly_rate}`} />
          <Row label="Open work orders" value={String(technician.open_work_orders)} />
          <Row label="Coordinates" value={coords} />
          <Row
            label="Status"
            value={
              <Badge variant="secondary">
                {technician.is_active ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
        </dl>
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

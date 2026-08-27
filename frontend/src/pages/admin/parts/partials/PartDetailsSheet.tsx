import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Part } from '@/lib/api/types'

export function PartDetailsSheet({
  part,
  open,
  onOpenChange,
}: {
  part: Part | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!part) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{part.name}</SheetTitle>
          <SheetDescription>{part.sku}</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Description" value={part.description || '—'} />
          <Row label="Stock" value={String(part.stock_qty)} />
          <Row label="Unit price" value={`$${part.unit_price}`} />
          <Row label="Created" value={new Date(part.created_at).toLocaleDateString()} />
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

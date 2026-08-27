import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Customer } from '@/lib/api/types'

export function CustomerDetailsSheet({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!customer) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{customer.name}</SheetTitle>
          <SheetDescription>Customer details</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Company ID" value={String(customer.company)} />
          <Row label="Email" value={customer.email || '—'} />
          <Row label="Phone" value={customer.phone || '—'} />
          <Row label="Address" value={customer.address || '—'} />
          <Row label="Sites" value={String(customer.site_count)} />
          <Row label="Created" value={new Date(customer.created_at).toLocaleDateString()} />
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

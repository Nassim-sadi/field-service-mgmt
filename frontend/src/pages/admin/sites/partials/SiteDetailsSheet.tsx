import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Site } from '@/lib/api/types'

export function SiteDetailsSheet({
  site,
  open,
  onOpenChange,
}: {
  site: Site | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!site) return null

  const coords =
    site.latitude != null && site.longitude != null
      ? `${site.latitude}, ${site.longitude}`
      : '—'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{site.name}</SheetTitle>
          <SheetDescription>{site.customer_name}</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Address" value={site.address || '—'} />
          <Row label="Coordinates" value={coords} />
          <Row label="Contact" value={site.contact_name || '—'} />
          <Row label="Phone" value={site.contact_phone || '—'} />
          <Row label="Assets" value={String(site.asset_count)} />
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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AssetStatusBadge } from '@/components/app/status-badge'
import type { Asset } from '@/lib/api/types'

export function AssetDetailsSheet({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!asset) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{asset.name}</SheetTitle>
          <SheetDescription>{asset.site_name}</SheetDescription>
        </SheetHeader>
        <dl className="space-y-3 text-sm">
          <Row label="Type" value={asset.asset_type || '—'} />
          <Row label="Serial number" value={asset.serial_number || '—'} />
          <Row
            label="Status"
            value={<AssetStatusBadge status={asset.status} />}
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

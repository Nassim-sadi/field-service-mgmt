import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { ServiceReport } from '@/lib/api/types'

export function ServiceReportDetailsSheet({
  report,
  open,
  onOpenChange,
}: {
  report: ServiceReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!report) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Service report · {report.work_order_number}</SheetTitle>
          <SheetDescription>
            <Badge variant="secondary">
              {report.customer_confirmation ? 'Customer confirmed' : 'Not confirmed'}
            </Badge>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 text-sm">
          <dl className="space-y-3">
            <Row label="Labor hours" value={`${report.labor_hours} hrs`} />
            <Row label="Signature" value={report.signature || '—'} />
          </dl>
          <div className="space-y-1">
            <div className="font-medium">Diagnosis</div>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {report.diagnosis || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Resolution</div>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {report.resolution || '—'}
            </p>
          </div>
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

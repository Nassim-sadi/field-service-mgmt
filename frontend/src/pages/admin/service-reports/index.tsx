import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { ServiceReport } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { PaginatedFooter } from '@/components/app/paginated-footer'
import { ViewAction } from '@/components/app/row-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceReportDetailsSheet } from './partials/ServiceReportDetailsSheet'

export function ServiceReportsPage() {
  const [search, setSearch] = useState('')
  const [detailsReport, setDetailsReport] = useState<ServiceReport | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<ServiceReport>({
      url: '/service-reports/',
      queryKey: queryKeys.serviceReports,
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service Reports"
        description="Completed work order reports"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search service reports…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work order</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Labor hours</TableHead>
                <TableHead>Confirmed</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (data?.results ?? []).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs">
                      {report.work_order_number}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {report.diagnosis || '—'}
                    </TableCell>
                    <TableCell>{report.labor_hours} hrs</TableCell>
                    <TableCell>{report.customer_confirmation ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <ViewAction
                        onClick={() => {
                          setDetailsReport(report)
                          setDetailsOpen(true)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No service reports yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginatedFooter
            count={data?.count ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {detailsReport && (
        <ServiceReportDetailsSheet
          report={detailsReport}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

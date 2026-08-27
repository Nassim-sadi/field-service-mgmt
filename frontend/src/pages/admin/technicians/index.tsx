import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { Technician } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { PaginatedFooter } from '@/components/app/paginated-footer'
import { EditAction, ViewAction } from '@/components/app/row-actions'
import { Badge } from '@/components/ui/badge'
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
import { TechnicianEditDialog } from './partials/TechnicianEditDialog'
import { TechnicianDetailsSheet } from './partials/TechnicianDetailsSheet'

export function TechniciansPage() {
  const [search, setSearch] = useState('')
  const [editTechnician, setEditTechnician] = useState<Technician | null>(null)
  const [detailsTechnician, setDetailsTechnician] = useState<Technician | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<Technician>({
      url: '/technicians/',
      queryKey: [...queryKeys.technicians],
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Technicians"
        description="Field staff and their assignments"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search technicians…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Open orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (data?.results ?? []).map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="font-medium">
                      {technician.full_name || technician.username}
                    </TableCell>
                    <TableCell>{technician.username}</TableCell>
                    <TableCell>{technician.specialty || '—'}</TableCell>
                    <TableCell>${technician.hourly_rate}</TableCell>
                    <TableCell>{technician.open_work_orders}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {technician.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsTechnician(technician)
                            setDetailsOpen(true)
                          }}
                        />
                        <EditAction
                          onClick={() => {
                            setEditTechnician(technician)
                            setEditOpen(true)
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No technicians found.
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

      {editTechnician && (
        <TechnicianEditDialog
          technician={editTechnician}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      {detailsTechnician && (
        <TechnicianDetailsSheet
          technician={detailsTechnician}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

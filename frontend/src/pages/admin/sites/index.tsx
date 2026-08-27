import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { Site } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { PaginatedFooter } from '@/components/app/paginated-footer'
import { EditAction, ViewAction } from '@/components/app/row-actions'
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
import { SiteCreateDialog } from './partials/SiteCreateDialog'
import { SiteEditDialog } from './partials/SiteEditDialog'
import { SiteDetailsSheet } from './partials/SiteDetailsSheet'

export function SitesPage() {
  const [search, setSearch] = useState('')
  const [editSite, setEditSite] = useState<Site | null>(null)
  const [detailsSite, setDetailsSite] = useState<Site | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<Site>({
      url: '/sites/',
      queryKey: [...queryKeys.sites],
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sites"
        description="Manage customer sites"
        action={<SiteCreateDialog />}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search sites…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (data?.results ?? []).map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>{site.customer_name}</TableCell>
                    <TableCell>{site.address || '—'}</TableCell>
                    <TableCell>
                      {site.latitude != null && site.longitude != null
                        ? `${site.latitude}, ${site.longitude}`
                        : '—'}
                    </TableCell>
                    <TableCell>{site.asset_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsSite(site)
                            setDetailsOpen(true)
                          }}
                        />
                        <EditAction
                          onClick={() => {
                            setEditSite(site)
                            setEditOpen(true)
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No sites found.
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

      {editSite && (
        <SiteEditDialog site={editSite} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {detailsSite && (
        <SiteDetailsSheet
          site={detailsSite}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

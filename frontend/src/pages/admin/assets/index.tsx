import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { Asset } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { AssetStatusBadge } from '@/components/app/status-badge'
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
import { AssetCreateDialog } from './partials/AssetCreateDialog'
import { AssetEditDialog } from './partials/AssetEditDialog'
import { AssetDetailsSheet } from './partials/AssetDetailsSheet'

export function AssetsPage() {
  const [search, setSearch] = useState('')
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [detailsAsset, setDetailsAsset] = useState<Asset | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<Asset>({
      url: '/assets/',
      queryKey: [...queryKeys.assets],
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assets"
        description="Manage equipment and devices"
        action={<AssetCreateDialog />}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search assets…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Serial number</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
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
                (data?.results ?? []).map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.asset_type || '—'}</TableCell>
                    <TableCell>{asset.serial_number || '—'}</TableCell>
                    <TableCell>{asset.site_name}</TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsAsset(asset)
                            setDetailsOpen(true)
                          }}
                        />
                        <EditAction
                          onClick={() => {
                            setEditAsset(asset)
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
                    No assets found.
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

      {editAsset && (
        <AssetEditDialog asset={editAsset} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {detailsAsset && (
        <AssetDetailsSheet
          asset={detailsAsset}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

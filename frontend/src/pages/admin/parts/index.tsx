import { useState } from 'react'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { Part } from '@/lib/api/types'
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
import { PartCreateDialog } from './partials/PartCreateDialog'
import { PartEditDialog } from './partials/PartEditDialog'
import { PartDetailsSheet } from './partials/PartDetailsSheet'

export function PartsPage() {
  const [search, setSearch] = useState('')
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [detailsPart, setDetailsPart] = useState<Part | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<Part>({
      url: '/parts/',
      queryKey: [...queryKeys.parts],
      search,
    })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Parts"
        description="Inventory and spare parts"
        action={<PartCreateDialog />}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Search parts…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead className="w-32" />
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
                (data?.results ?? []).map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono text-xs">{part.sku}</TableCell>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.stock_qty}</TableCell>
                    <TableCell>${part.unit_price}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsPart(part)
                            setDetailsOpen(true)
                          }}
                        />
                        <EditAction
                          onClick={() => {
                            setEditPart(part)
                            setEditOpen(true)
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No parts found.
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

      {editPart && (
        <PartEditDialog part={editPart} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {detailsPart && (
        <PartDetailsSheet
          part={detailsPart}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, Play, UserPlus, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { usePagedList } from '@/lib/api/hooks'
import type { WorkOrder, WorkOrderStatus } from '@/lib/api/types'
import type { WorkOrderPriority } from '@/lib/api/types'
import { PageHeader } from '@/components/app/page-header'
import { PaginatedFooter } from '@/components/app/paginated-footer'
import { PriorityBadge, StatusBadge } from '@/components/app/status-badge'
import { ViewAction } from '@/components/app/row-actions'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WorkOrderCreateDialog } from './partials/WorkOrderCreateDialog'
import { WorkOrderAssignDialog } from './partials/WorkOrderAssignDialog'
import { WorkOrderDetailsSheet } from './partials/WorkOrderDetailsSheet'

const actionFor: Record<string, { url: string; label: string; icon: LucideIcon }> = {
  assign: { url: 'assign', label: 'Assign', icon: UserPlus },
  accepted: { url: 'accept', label: 'Accept', icon: Check },
  in_progress: { url: 'start', label: 'Start', icon: Play },
  completed: { url: 'complete', label: 'Complete', icon: CheckCheck },
}

const statusFilterOptions: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function WorkOrdersPage() {
  const { isManagement } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [detailsOrder, setDetailsOrder] = useState<WorkOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [assignOrder, setAssignOrder] = useState<WorkOrder | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [confirm, setConfirm] = useState<{
    id: number
    url: string
    label: string
    number: string
  } | null>(null)

  const { data, isLoading, page, pageSize, setPage, setPageSize } =
    usePagedList<WorkOrder>({
      url: '/work-orders/',
      queryKey: [...queryKeys.workOrders],
      search,
      resetOn: status,
      params: {
        status: status || undefined,
      },
    })

  const transition = useMutation({
    mutationFn: ({ id, url }: { id: number; url: string }) =>
      api.post(`/work-orders/${id}/${url}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders })
      toast.success('Status updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Work Orders"
        description="Service requests and field dispatches"
        action={isManagement ? <WorkOrderCreateDialog /> : undefined}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search work orders…"
              className="max-w-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-56">Actions</TableHead>
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
                (data?.results ?? []).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.number}
                      {order.is_overdue && (
                        <span className="ml-1 text-destructive">●</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{order.title}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.assigned_technician_name || '—'}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={order.priority as WorkOrderPriority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status as WorkOrderStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewAction
                          onClick={() => {
                            setDetailsOrder(order)
                            setDetailsOpen(true)
                          }}
                        />
                        {isManagement &&
                          order.status === 'new' &&
                          order.available_transitions.includes('assigned') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssignOrder(order)
                                setAssignOpen(true)
                              }}
                            >
                              <UserPlus />
                              Assign
                            </Button>
                          )}
                        {order.available_transitions
                          .map((t) => actionFor[t])
                          .filter(Boolean)
                          .map((action) => (
                            <Button
                              key={action.url}
                              variant="ghost"
                              size="sm"
                              disabled={transition.isPending}
                              onClick={() =>
                                setConfirm({
                                  id: order.id,
                                  url: action.url,
                                  label: action.label,
                                  number: order.number,
                                })
                              }
                            >
                              <action.icon />
                              {action.label}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (data?.results ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No work orders found.
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

      {assignOrder && (
        <WorkOrderAssignDialog
          workOrder={assignOrder}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirm?.label ?? 'action'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirm?.label.toLowerCase()} work order{' '}
              {confirm?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={transition.isPending}
              onClick={() => {
                if (confirm) transition.mutate({ id: confirm.id, url: confirm.url })
                setConfirm(null)
              }}
            >
              {transition.isPending ? 'Saving…' : confirm?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {detailsOrder && (
        <WorkOrderDetailsSheet
          workOrder={detailsOrder}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Paginated, Technician, WorkOrder } from '@/lib/api/types'

export function WorkOrderAssignDialog({
  workOrder,
  open,
  onOpenChange,
}: {
  workOrder: WorkOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [technicianId, setTechnicianId] = useState('')
  const [error, setError] = useState('')

  const { data: technicians } = useQuery({
    queryKey: queryKeys.technicians,
    queryFn: async () =>
      (await api.get<Paginated<Technician>>('/technicians/', { params: { is_active: true } }))
        .data.results,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/work-orders/${workOrder?.id}/assign/`, {
        technician: Number(technicianId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders })
      toast.success('Work order assigned')
      setTechnicianId('')
      setError('')
      onOpenChange(false)
    },
    onError: (error) => setError(apiErrorMessage(error)),
  })

  if (!workOrder) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {workOrder.number}</DialogTitle>
          <DialogDescription>Select a technician for this work order.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="assign-technician">Technician</FieldLabel>
          <FieldContent>
            <Select value={technicianId} onValueChange={(v) => v && setTechnicianId(v)}>
              <SelectTrigger id="assign-technician">
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {(technicians ?? []).map((technician) => (
                  <SelectItem key={technician.id} value={String(technician.id)}>
                    {technician.full_name || technician.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </FieldContent>
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!technicianId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

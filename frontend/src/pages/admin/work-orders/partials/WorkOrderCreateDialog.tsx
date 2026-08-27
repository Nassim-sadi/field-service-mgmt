import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type {
  Asset,
  Customer,
  Paginated,
  Site,
  WorkOrder,
  WorkOrderPriority,
} from '@/lib/api/types'
import { workOrderSchema, type WorkOrderFormValues } from '../schema'

const defaultValues: WorkOrderFormValues = {
  customer: '',
  site: '',
  asset: '',
  title: '',
  description: '',
  priority: 'medium',
  due_at: '',
}

export function WorkOrderCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<WorkOrderFormValues>({
      resolver: zodResolver(workOrderSchema),
      defaultValues,
    })

  const { data: customers } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => (await api.get<Paginated<Customer>>('/customers/')).data.results,
  })

  const customerId = watch('customer')
  const { data: sites } = useQuery({
    queryKey: [...queryKeys.sites, customerId],
    enabled: !!customerId,
    queryFn: async () =>
      (await api.get<Paginated<Site>>('/sites/', { params: { customer: customerId } }))
        .data.results,
  })

  const siteId = watch('site')
  const { data: assets } = useQuery({
    queryKey: ['assets', siteId],
    enabled: !!siteId,
    queryFn: async () =>
      (await api.get<Paginated<Asset>>('/assets/', { params: { site: siteId } })).data
        .results,
  })

  const mutation = useMutation({
    mutationFn: (values: WorkOrderFormValues) =>
      api.post<WorkOrder>('/work-orders/', {
        customer: Number(values.customer),
        site: Number(values.site),
        asset: values.asset ? Number(values.asset) : null,
        title: values.title,
        description: values.description,
        priority: values.priority,
        due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders })
      toast.success('Work order created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<WorkOrderFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New work order
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New work order</DialogTitle>
          <DialogDescription>Create a service request.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="wo-customer">Customer</FieldLabel>
            <FieldContent>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  if (v) setValue('customer', v)
                  setValue('site', '')
                  setValue('asset', '')
                }}
              >
                <SelectTrigger id="wo-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.customer ? [errors.customer] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="wo-site">Site</FieldLabel>
            <FieldContent>
              <Select
                value={siteId}
                disabled={!customerId}
                onValueChange={(v) => {
                  if (v) setValue('site', v)
                  setValue('asset', '')
                }}
              >
                <SelectTrigger id="wo-site">
                  <SelectValue placeholder={customerId ? 'Select site' : 'Select customer first'} />
                </SelectTrigger>
                <SelectContent>
                  {(sites ?? []).map((site) => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.site ? [errors.site] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="wo-asset">Asset</FieldLabel>
              <FieldContent>
                <Select
                  value={watch('asset')}
                  disabled={!siteId}
                  onValueChange={(v) => v && setValue('asset', v)}
                >
                  <SelectTrigger id="wo-asset">
                    <SelectValue placeholder={siteId ? 'Optional' : 'Select site first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(assets ?? []).map((asset) => (
                      <SelectItem key={asset.id} value={String(asset.id)}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={errors.asset ? [errors.asset] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="wo-priority">Priority</FieldLabel>
              <FieldContent>
                <Select
                  value={watch('priority')}
                  onValueChange={(v) => setValue('priority', v as WorkOrderPriority)}
                >
                  <SelectTrigger id="wo-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={errors.priority ? [errors.priority] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="wo-title">Title</FieldLabel>
            <FieldContent>
              <Input id="wo-title" required {...register('title')} />
              <FieldError errors={errors.title ? [errors.title] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="wo-desc">Description</FieldLabel>
            <FieldContent>
              <Textarea id="wo-desc" rows={3} {...register('description')} />
              <FieldError errors={errors.description ? [errors.description] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="wo-due">Due (optional)</FieldLabel>
            <FieldContent>
              <Input id="wo-due" type="datetime-local" {...register('due_at')} />
              <FieldError errors={errors.due_at ? [errors.due_at] : undefined} />
            </FieldContent>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

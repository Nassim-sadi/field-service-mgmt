import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
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
import type { Customer, Paginated, Site } from '@/lib/api/types'
import { siteSchema, type SiteFormValues } from '../schema'

export function SiteEditDialog({
  site,
  open,
  onOpenChange,
}: {
  site: Site
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      customer: String(site.customer),
      name: site.name,
      address: site.address,
      latitude: site.latitude != null ? String(site.latitude) : '',
      longitude: site.longitude != null ? String(site.longitude) : '',
      contact_name: site.contact_name,
      contact_phone: site.contact_phone,
    },
  })

  const { data: customers } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => (await api.get<Paginated<Customer>>('/customers/')).data.results,
  })

  useEffect(() => {
    if (open) {
      reset({
        customer: String(site.customer),
        name: site.name,
        address: site.address,
        latitude: site.latitude != null ? String(site.latitude) : '',
        longitude: site.longitude != null ? String(site.longitude) : '',
        contact_name: site.contact_name,
        contact_phone: site.contact_phone,
      })
    }
  }, [open, site, reset])

  const mutation = useMutation({
    mutationFn: (values: SiteFormValues) =>
      api.patch(`/sites/${site.id}/`, {
        customer: Number(values.customer),
        name: values.name,
        address: values.address,
        latitude: values.latitude ? Number(values.latitude) : null,
        longitude: values.longitude ? Number(values.longitude) : null,
        contact_name: values.contact_name,
        contact_phone: values.contact_phone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites })
      toast.success('Site updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<SiteFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {site.name}</DialogTitle>
          <DialogDescription>Update site information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-site-customer">Customer</FieldLabel>
            <FieldContent>
              <Select value={watch('customer')} onValueChange={(v) => v && setValue('customer', v)}>
                <SelectTrigger id="edit-site-customer">
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
            <FieldLabel htmlFor="edit-site-name">Name</FieldLabel>
            <FieldContent>
              <Input id="edit-site-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-site-lat">Latitude</FieldLabel>
              <FieldContent>
                <Input id="edit-site-lat" {...register('latitude')} />
                <FieldError errors={errors.latitude ? [errors.latitude] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-site-lng">Longitude</FieldLabel>
              <FieldContent>
                <Input id="edit-site-lng" {...register('longitude')} />
                <FieldError errors={errors.longitude ? [errors.longitude] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-site-address">Address</FieldLabel>
            <FieldContent>
              <Textarea id="edit-site-address" rows={2} {...register('address')} />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-site-contact">Contact name</FieldLabel>
              <FieldContent>
                <Input id="edit-site-contact" {...register('contact_name')} />
                <FieldError errors={errors.contact_name ? [errors.contact_name] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-site-phone">Contact phone</FieldLabel>
              <FieldContent>
                <Input id="edit-site-phone" {...register('contact_phone')} />
                <FieldError errors={errors.contact_phone ? [errors.contact_phone] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import type { Customer, Paginated, Site } from '@/lib/api/types'
import { siteSchema, type SiteFormValues } from '../schema'
import { MapPicker } from '@/components/app/map-picker'

const defaultValues: SiteFormValues = {
  customer: '',
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  contact_name: '',
  contact_phone: '',
}

export function SiteCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<SiteFormValues>({
      resolver: zodResolver(siteSchema),
      defaultValues,
    })

  const { data: customers } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => (await api.get<Paginated<Customer>>('/customers/')).data.results,
  })

  const mutation = useMutation({
    mutationFn: (values: SiteFormValues) =>
      api.post<Site>('/sites/', {
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
      toast.success('Site created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<SiteFormValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add site
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New site</DialogTitle>
          <DialogDescription>Add a customer site.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="site-customer">Customer</FieldLabel>
            <FieldContent>
              <Select value={watch('customer')} onValueChange={(v) => v && setValue('customer', v)}>
                <SelectTrigger id="site-customer">
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
            <FieldLabel htmlFor="site-name">Name</FieldLabel>
            <FieldContent>
              <Input id="site-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Location (click map or edit fields)</FieldLabel>
            <FieldContent>
              <MapPicker
                lat={watch('latitude') ? Number(watch('latitude')) : null}
                lng={watch('longitude') ? Number(watch('longitude')) : null}
                onChange={(lat, lng) => {
                  setValue('latitude', String(lat.toFixed(6)))
                  setValue('longitude', String(lng.toFixed(6)))
                }}
              />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="site-lat">Latitude</FieldLabel>
              <FieldContent>
                <Input id="site-lat" {...register('latitude')} />
                <FieldError errors={errors.latitude ? [errors.latitude] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="site-lng">Longitude</FieldLabel>
              <FieldContent>
                <Input id="site-lng" {...register('longitude')} />
                <FieldError errors={errors.longitude ? [errors.longitude] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="site-address">Address</FieldLabel>
            <FieldContent>
              <Textarea id="site-address" rows={2} {...register('address')} />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="site-contact">Contact name</FieldLabel>
              <FieldContent>
                <Input id="site-contact" {...register('contact_name')} />
                <FieldError errors={errors.contact_name ? [errors.contact_name] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="site-phone">Contact phone</FieldLabel>
              <FieldContent>
                <Input id="site-phone" {...register('contact_phone')} />
                <FieldError errors={errors.contact_phone ? [errors.contact_phone] : undefined} />
              </FieldContent>
            </Field>
          </div>
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

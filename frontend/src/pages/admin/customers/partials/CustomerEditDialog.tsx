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
import type { Company, Customer, Paginated } from '@/lib/api/types'
import { customerSchema, type CustomerFormValues } from '../schema'

export function CustomerEditDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<CustomerFormValues>({
      resolver: zodResolver(customerSchema),
      defaultValues: {
        company: String(customer.company),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    })

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => (await api.get<Paginated<Company>>('/companies/')).data.results,
  })

  useEffect(() => {
    if (open) {
      reset({
        company: String(customer.company),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      })
    }
  }, [open, customer, reset])

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      api.patch(`/customers/${customer.id}/`, {
        ...values,
        company: Number(values.company),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      toast.success('Customer updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<CustomerFormValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {customer.name}</DialogTitle>
          <DialogDescription>Update customer information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-customer-company">Company</FieldLabel>
            <FieldContent>
              <Select value={watch('company')} onValueChange={(v) => v && setValue('company', v)}>
                <SelectTrigger id="edit-customer-company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {(companies ?? []).map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.company ? [errors.company] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-customer-name">Name</FieldLabel>
            <FieldContent>
              <Input id="edit-customer-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-customer-email">Email</FieldLabel>
            <FieldContent>
              <Input id="edit-customer-email" type="email" required {...register('email')} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-customer-phone">Phone</FieldLabel>
            <FieldContent>
              <Input id="edit-customer-phone" {...register('phone')} />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-customer-address">Address</FieldLabel>
            <FieldContent>
              <Textarea id="edit-customer-address" rows={3} {...register('address')} />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
            </FieldContent>
          </Field>
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

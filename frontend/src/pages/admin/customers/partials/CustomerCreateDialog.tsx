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
import type { Company, Customer, Paginated } from '@/lib/api/types'
import { customerSchema, type CustomerFormValues } from '../schema'

const defaultValues: CustomerFormValues = {
  company: '',
  name: '',
  email: '',
  phone: '',
  address: '',
}

export function CustomerCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<CustomerFormValues>({
      resolver: zodResolver(customerSchema),
      defaultValues,
    })

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => (await api.get<Paginated<Company>>('/companies/')).data.results,
  })

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      api.post<Customer>('/customers/', {
        ...values,
        company: Number(values.company),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      toast.success('Customer created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<CustomerFormValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>Add a customer account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="customer-company">Company</FieldLabel>
            <FieldContent>
              <Select
                value={watch('company')}
                onValueChange={(value) => value && setValue('company', value)}
              >
                <SelectTrigger id="customer-company">
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
            <FieldLabel htmlFor="customer-name">Name</FieldLabel>
            <FieldContent>
              <Input id="customer-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-email">Email</FieldLabel>
            <FieldContent>
              <Input id="customer-email" type="email" required {...register('email')} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
            <FieldContent>
              <Input id="customer-phone" {...register('phone')} />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-address">Address</FieldLabel>
            <FieldContent>
              <Textarea id="customer-address" rows={3} {...register('address')} />
              <FieldError errors={errors.address ? [errors.address] : undefined} />
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

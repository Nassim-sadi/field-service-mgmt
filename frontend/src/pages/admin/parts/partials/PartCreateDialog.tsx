import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Part } from '@/lib/api/types'
import { partSchema, type PartFormValues } from '../schema'

const defaultValues: PartFormValues = {
  sku: '',
  name: '',
  description: '',
  stock_qty: '0',
  unit_price: '0',
}

export function PartCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<PartFormValues>({
      resolver: zodResolver(partSchema),
      defaultValues,
    })

  const mutation = useMutation({
    mutationFn: (values: PartFormValues) =>
      api.post<Part>('/parts/', {
        sku: values.sku,
        name: values.name,
        description: values.description,
        stock_qty: Number(values.stock_qty),
        unit_price: Number(values.unit_price),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts })
      toast.success('Part created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<PartFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add part
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New part</DialogTitle>
          <DialogDescription>Add an inventory item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="part-sku">SKU</FieldLabel>
              <FieldContent>
                <Input id="part-sku" required {...register('sku')} />
                <FieldError errors={errors.sku ? [errors.sku] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="part-name">Name</FieldLabel>
              <FieldContent>
                <Input id="part-name" required {...register('name')} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="part-stock">Stock quantity</FieldLabel>
              <FieldContent>
                <Input id="part-stock" type="number" {...register('stock_qty')} />
                <FieldError errors={errors.stock_qty ? [errors.stock_qty] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="part-price">Unit price</FieldLabel>
              <FieldContent>
                <Input id="part-price" type="number" step="0.01" {...register('unit_price')} />
                <FieldError errors={errors.unit_price ? [errors.unit_price] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="part-desc">Description</FieldLabel>
            <FieldContent>
              <Textarea id="part-desc" rows={3} {...register('description')} />
              <FieldError errors={errors.description ? [errors.description] : undefined} />
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

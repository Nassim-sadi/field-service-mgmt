import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Part } from '@/lib/api/types'
import { partSchema, type PartFormValues } from '../schema'

export function PartEditDialog({
  part,
  open,
  onOpenChange,
}: {
  part: Part
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      sku: part.sku,
      name: part.name,
      description: part.description,
      stock_qty: String(part.stock_qty),
      unit_price: part.unit_price,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        sku: part.sku,
        name: part.name,
        description: part.description,
        stock_qty: String(part.stock_qty),
        unit_price: part.unit_price,
      })
    }
  }, [open, part, reset])

  const mutation = useMutation({
    mutationFn: (values: PartFormValues) =>
      api.patch(`/parts/${part.id}/`, {
        sku: values.sku,
        name: values.name,
        description: values.description,
        stock_qty: Number(values.stock_qty),
        unit_price: Number(values.unit_price),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts })
      toast.success('Part updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<PartFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {part.name}</DialogTitle>
          <DialogDescription>Update inventory item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-part-sku">SKU</FieldLabel>
              <FieldContent>
                <Input id="edit-part-sku" required {...register('sku')} />
                <FieldError errors={errors.sku ? [errors.sku] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-part-name">Name</FieldLabel>
              <FieldContent>
                <Input id="edit-part-name" required {...register('name')} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-part-stock">Stock quantity</FieldLabel>
              <FieldContent>
                <Input id="edit-part-stock" type="number" {...register('stock_qty')} />
                <FieldError errors={errors.stock_qty ? [errors.stock_qty] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-part-price">Unit price</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-part-price"
                  type="number"
                  step="0.01"
                  {...register('unit_price')}
                />
                <FieldError errors={errors.unit_price ? [errors.unit_price] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-part-desc">Description</FieldLabel>
            <FieldContent>
              <Textarea id="edit-part-desc" rows={3} {...register('description')} />
              <FieldError errors={errors.description ? [errors.description] : undefined} />
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

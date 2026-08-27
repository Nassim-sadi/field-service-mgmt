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
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Technician } from '@/lib/api/types'
import { technicianSchema, type TechnicianFormValues } from '../schema'

export function TechnicianEditDialog({
  technician,
  open,
  onOpenChange,
}: {
  technician: Technician
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<TechnicianFormValues>({
      resolver: zodResolver(technicianSchema),
      defaultValues: {
        specialty: technician.specialty,
        hourly_rate: technician.hourly_rate,
        is_active: technician.is_active,
        latitude: technician.latitude != null ? String(technician.latitude) : '',
        longitude: technician.longitude != null ? String(technician.longitude) : '',
      },
    })

  useEffect(() => {
    if (open) {
      reset({
        specialty: technician.specialty,
        hourly_rate: technician.hourly_rate,
        is_active: technician.is_active,
        latitude: technician.latitude != null ? String(technician.latitude) : '',
        longitude: technician.longitude != null ? String(technician.longitude) : '',
      })
    }
  }, [open, technician, reset])

  const mutation = useMutation({
    mutationFn: (values: TechnicianFormValues) =>
      api.patch(`/technicians/${technician.id}/`, {
        specialty: values.specialty,
        hourly_rate: values.hourly_rate,
        is_active: values.is_active,
        latitude: values.latitude ? Number(values.latitude) : null,
        longitude: values.longitude ? Number(values.longitude) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.technicians })
      toast.success('Technician updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<TechnicianFormValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {technician.full_name || technician.username}</DialogTitle>
          <DialogDescription>Update technician details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-tech-specialty">Specialty</FieldLabel>
            <FieldContent>
              <Input id="edit-tech-specialty" {...register('specialty')} />
              <FieldError errors={errors.specialty ? [errors.specialty] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-tech-rate">Hourly rate</FieldLabel>
            <FieldContent>
              <Input
                id="edit-tech-rate"
                type="number"
                step="0.01"
                {...register('hourly_rate')}
              />
              <FieldError errors={errors.hourly_rate ? [errors.hourly_rate] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-tech-lat">Latitude</FieldLabel>
              <FieldContent>
                <Input id="edit-tech-lat" {...register('latitude')} />
                <FieldError errors={errors.latitude ? [errors.latitude] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-tech-lng">Longitude</FieldLabel>
              <FieldContent>
                <Input id="edit-tech-lng" {...register('longitude')} />
                <FieldError errors={errors.longitude ? [errors.longitude] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="edit-tech-active">Active</FieldLabel>
            <FieldContent>
              <Switch
                id="edit-tech-active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <FieldError errors={errors.is_active ? [errors.is_active] : undefined} />
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

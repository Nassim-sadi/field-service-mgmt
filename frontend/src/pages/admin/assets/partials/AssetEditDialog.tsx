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
import type { Asset, AssetStatus, Paginated, Site } from '@/lib/api/types'
import { assetSchema, type AssetFormValues } from '../schema'

export function AssetEditDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      site: String(asset.site),
      name: asset.name,
      asset_type: asset.asset_type,
      serial_number: asset.serial_number,
      status: asset.status,
    },
  })

  const { data: sites } = useQuery({
    queryKey: queryKeys.sites,
    queryFn: async () => (await api.get<Paginated<Site>>('/sites/')).data.results,
  })

  useEffect(() => {
    if (open) {
      reset({
        site: String(asset.site),
        name: asset.name,
        asset_type: asset.asset_type,
        serial_number: asset.serial_number,
        status: asset.status,
      })
    }
  }, [open, asset, reset])

  const mutation = useMutation({
    mutationFn: (values: AssetFormValues) =>
      api.patch(`/assets/${asset.id}/`, {
        site: Number(values.site),
        name: values.name,
        asset_type: values.asset_type,
        serial_number: values.serial_number,
        status: values.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets })
      toast.success('Asset updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<AssetFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {asset.name}</DialogTitle>
          <DialogDescription>Update asset information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-asset-site">Site</FieldLabel>
            <FieldContent>
              <Select value={watch('site')} onValueChange={(v) => v && setValue('site', v)}>
                <SelectTrigger id="edit-asset-site">
                  <SelectValue placeholder="Select site" />
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
          <Field>
            <FieldLabel htmlFor="edit-asset-name">Name</FieldLabel>
            <FieldContent>
              <Input id="edit-asset-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-asset-type">Type</FieldLabel>
              <FieldContent>
                <Input id="edit-asset-type" {...register('asset_type')} />
                <FieldError errors={errors.asset_type ? [errors.asset_type] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-asset-serial">Serial number</FieldLabel>
              <FieldContent>
                <Input id="edit-asset-serial" {...register('serial_number')} />
                <FieldError errors={errors.serial_number ? [errors.serial_number] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-asset-status">Status</FieldLabel>
            <FieldContent>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as AssetStatus)}
              >
                <SelectTrigger id="edit-asset-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="under_maintenance">Under maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of service</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={errors.status ? [errors.status] : undefined} />
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

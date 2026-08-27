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

const defaultValues: AssetFormValues = {
  site: '',
  name: '',
  asset_type: '',
  serial_number: '',
  status: 'operational',
}

export function AssetCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<AssetFormValues>({
      resolver: zodResolver(assetSchema),
      defaultValues,
    })

  const { data: sites } = useQuery({
    queryKey: queryKeys.sites,
    queryFn: async () => (await api.get<Paginated<Site>>('/sites/')).data.results,
  })

  const mutation = useMutation({
    mutationFn: (values: AssetFormValues) =>
      api.post<Asset>('/assets/', {
        site: Number(values.site),
        name: values.name,
        asset_type: values.asset_type,
        serial_number: values.serial_number,
        status: values.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets })
      toast.success('Asset created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<AssetFormValues> = (values) => mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add asset
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset</DialogTitle>
          <DialogDescription>Add a piece of equipment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="asset-site">Site</FieldLabel>
            <FieldContent>
              <Select value={watch('site')} onValueChange={(v) => v && setValue('site', v)}>
                <SelectTrigger id="asset-site">
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
            <FieldLabel htmlFor="asset-name">Name</FieldLabel>
            <FieldContent>
              <Input id="asset-name" required {...register('name')} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="asset-type">Type</FieldLabel>
              <FieldContent>
                <Input id="asset-type" {...register('asset_type')} />
                <FieldError errors={errors.asset_type ? [errors.asset_type] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-serial">Serial number</FieldLabel>
              <FieldContent>
                <Input id="asset-serial" {...register('serial_number')} />
                <FieldError errors={errors.serial_number ? [errors.serial_number] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="asset-status">Status</FieldLabel>
            <FieldContent>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as AssetStatus)}
              >
                <SelectTrigger id="asset-status">
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

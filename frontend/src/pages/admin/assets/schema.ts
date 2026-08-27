import { z } from 'zod'

export const assetSchema = z.object({
  site: z.string().min(1, 'Site is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  asset_type: z.string().max(100, 'Asset type must be 100 characters or fewer'),
  serial_number: z
    .string()
    .max(100, 'Serial number must be 100 characters or fewer'),
  status: z.enum(['operational', 'under_maintenance', 'out_of_service']),
})

export type AssetFormValues = z.infer<typeof assetSchema>

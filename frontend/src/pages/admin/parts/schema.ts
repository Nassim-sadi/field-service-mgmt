import { z } from 'zod'

export const partSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must be 100 characters or fewer'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  description: z.string(),
  stock_qty: z.string().refine(
    (value) => /^\d+$/.test(value),
    'Stock quantity must be a whole number'
  ),
  unit_price: z.string().refine(
    (value) => /^\d*\.?\d{0,2}$/.test(value),
    'Unit price must be a valid amount'
  ),
})

export type PartFormValues = z.infer<typeof partSchema>

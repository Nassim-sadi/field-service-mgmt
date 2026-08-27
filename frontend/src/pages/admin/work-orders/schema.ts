import { z } from 'zod'

export const workOrderSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  site: z.string().min(1, 'Site is required'),
  asset: z.string(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_at: z.string(),
})

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>

import { z } from 'zod'

export const customerSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(40, 'Phone must be 40 characters or fewer'),
  address: z.string(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

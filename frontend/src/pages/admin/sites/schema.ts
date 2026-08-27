import { z } from 'zod'

const numberOrEmpty = z
  .string()
  .refine(
    (value) =>
      value === '' || /^-?\d*\.?\d+$/.test(value),
    'Enter a valid number'
  )

const coordinate = (min: number, max: number, label: string) =>
  numberOrEmpty.refine(
    (value) => value === '' || (Number(value) >= min && Number(value) <= max),
    `${label} must be between ${min} and ${max}`
  )

export const siteSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  address: z.string(),
  latitude: coordinate(-90, 90, 'Latitude'),
  longitude: coordinate(-180, 180, 'Longitude'),
  contact_name: z.string().max(200, 'Contact name is too long'),
  contact_phone: z.string().max(40, 'Contact phone is too long'),
})

export type SiteFormValues = z.infer<typeof siteSchema>

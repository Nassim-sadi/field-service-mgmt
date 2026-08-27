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

export const technicianSchema = z.object({
  specialty: z.string().max(200, 'Specialty must be 200 characters or fewer'),
  hourly_rate: z.string().refine(
    (value) => /^\d*\.?\d{0,2}$/.test(value),
    'Hourly rate must be a valid amount'
  ),
  is_active: z.boolean(),
  latitude: coordinate(-90, 90, 'Latitude'),
  longitude: coordinate(-180, 180, 'Longitude'),
})

export type TechnicianFormValues = z.infer<typeof technicianSchema>

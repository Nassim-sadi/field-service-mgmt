import { z } from 'zod'

export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(150, 'Username must be 150 characters or fewer')
    .regex(
      /^[\w.@+-]+$/,
      'Usernames may only contain letters, digits and @/./+/-/_'
    ),
  email: z
    .string()
    .max(254, 'Email must be 254 characters or fewer')
    .email('Enter a valid email address')
    .or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().max(150, 'First name is too long'),
  last_name: z.string().max(150, 'Last name is too long'),
  role: z.enum(['admin', 'manager', 'technician', 'customer']),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

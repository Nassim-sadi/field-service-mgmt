import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Role } from '@/lib/api/types'
import { createUserSchema, type CreateUserFormValues } from '../schema'

const defaultValues: CreateUserFormValues = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'customer',
}

export function UserCreateDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<CreateUserFormValues>({
      resolver: zodResolver(createUserSchema),
      defaultValues,
    })

  const mutation = useMutation({
    mutationFn: (values: CreateUserFormValues) => api.post('/users/', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('User created')
      setOpen(false)
      reset(defaultValues)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<CreateUserFormValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add user
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Create a user account with a role.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <FieldContent>
              <Input id="username" required {...register('username')} />
              <FieldError errors={errors.username ? [errors.username] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input id="email" type="email" {...register('email')} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </FieldContent>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="first_name">First name</FieldLabel>
              <FieldContent>
                <Input id="first_name" {...register('first_name')} />
                <FieldError errors={errors.first_name ? [errors.first_name] : undefined} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="last_name">Last name</FieldLabel>
              <FieldContent>
                <Input id="last_name" {...register('last_name')} />
                <FieldError errors={errors.last_name ? [errors.last_name] : undefined} />
              </FieldContent>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                required
                {...register('password', { minLength: 8 })}
              />
              <FieldError errors={errors.password ? [errors.password] : undefined} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <FieldContent>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as Role)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={errors.role ? [errors.role] : undefined} />
            </FieldContent>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  Field,
  FieldContent,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api, apiErrorMessage } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Role, User } from '@/lib/api/types'

interface EditUserValues {
  role: Role
  is_active: boolean
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { handleSubmit, reset, setValue, watch } = useForm<EditUserValues>({
    defaultValues: { role: user.role, is_active: user.is_active },
  })

  useEffect(() => {
    if (open) {
      reset({ role: user.role, is_active: user.is_active })
    }
  }, [open, user, reset])

  const mutation = useMutation({
    mutationFn: (values: EditUserValues) =>
      api.patch(`/users/${user.id}/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('User updated')
      onOpenChange(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const onSubmit: SubmitHandler<EditUserValues> = (values) =>
    mutation.mutate(values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.username}</DialogTitle>
          <DialogDescription>Update role and account status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email || '—'}</span>
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-user-role">Role</FieldLabel>
            <FieldContent>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as Role)}
              >
                <SelectTrigger id="edit-user-role">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="edit-user-active">Active</FieldLabel>
            <FieldContent>
              <Switch
                id="edit-user-active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
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

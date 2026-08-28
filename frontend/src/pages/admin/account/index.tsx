import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Check, Copy, Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleBadge } from '@/components/app/status-badge'
import { PageHeader } from '@/components/app/page-header'
import { api, apiErrorMessage, tokenStore } from '@/lib/api/client'
import { useAuth } from '@/lib/auth'

interface PasswordValues {
  old_password: string
  new_password: string
  confirm_new_password: string
}

export function AccountPage() {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const { register, handleSubmit, reset } = useForm<PasswordValues>({
    defaultValues: { old_password: '', new_password: '', confirm_new_password: '' },
  })

  const onChangePassword: SubmitHandler<PasswordValues> = async (values) => {
    setSubmitting(true)
    try {
      await api.post('/users/change_password/', values)
      toast.success('Password changed')
      reset()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const accessToken = tokenStore.getAccess() ?? ''

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(accessToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 1500)
    } catch {
      toast.error('Could not copy token')
    }
  }

  const fullName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : ''

  return (
    <div className="space-y-4">
      <PageHeader title="Account Settings" description="Manage your profile, password, and API access" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user?.username ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{fullName || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              {user && <RoleBadge role={user.role} />}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Current password</Label>
                <Input
                  id="old-password"
                  type="password"
                  autoComplete="current-password"
                  {...register('old_password', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('new_password', { required: true, minLength: 8 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirm_new_password', { required: true })}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <KeyRound />
                {submitting ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API access</CardTitle>
          <CardDescription>Base URL and personal access token for integrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <Label>API base URL</Label>
            <code className="rounded-md bg-muted px-3 py-2 text-xs">
              {import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}
            </code>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Access token</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                {showToken ? accessToken : accessToken.slice(0, 12) + '••••••••••••'}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowToken((value) => !value)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff /> : <Eye />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyToken}
                disabled={!accessToken}
              >
                {tokenCopied ? <Check /> : <Copy />}
                {tokenCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            {!accessToken && (
              <p className="text-xs text-muted-foreground">You must be signed in to view a token.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

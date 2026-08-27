import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth'

interface LoginFormValues {
  username: string
  password: string
}

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: { username: '', password: '' },
  })

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setSubmitting(true)
    try {
      await login(values.username, values.password)
      const from = (location.state as { from?: string } | null)?.from
      toast.success('Signed in')
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (user) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Access the FieldService management console</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" {...register('username', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', { required: true })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

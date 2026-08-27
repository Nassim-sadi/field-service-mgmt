import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { ArrowRight, BellRing, ClipboardCheck, MapPin, Wrench } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, apiErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth'
import type { WorkOrderPriority } from '@/lib/api/types'

interface ReportFormValues {
  title: string
  description: string
  priority: WorkOrderPriority
  location: string
}

const features = [
  {
    icon: ClipboardCheck,
    title: 'Tracked service requests',
    description: 'Follow every work order through a clear, audited lifecycle.',
  },
  {
    icon: MapPin,
    title: 'Geolocated field sites',
    description: 'Technicians see exactly where the job is on the map.',
  },
  {
    icon: BellRing,
    title: 'SLAs and escalations',
    description: 'Overdue alerts keep urgent work front and center.',
  },
]

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset, setValue } = useForm<ReportFormValues>({
    defaultValues: { title: '', description: '', priority: 'medium', location: '' },
  })

  const onSubmit: SubmitHandler<ReportFormValues> = async (values) => {
    if (!user) {
      toast('Sign in to submit a service request')
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/work-orders/', {
        title: values.title,
        description: `${values.location ? `${values.location}\n\n` : ''}${values.description}`,
        priority: values.priority,
      })
      toast.success('Service request submitted')
      reset()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="size-4" />
            </span>
            <span className="font-semibold">FieldService</span>
          </div>
          <nav>
            {user ? (
              <Button render={<Link to="/admin" />}>
                Go to dashboard <ArrowRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button render={<Link to="/login" />} variant="outline">
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Field service management for modern operations
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Dispatch technicians, manage work orders, track inventory, and keep every
          customer site running — all from one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {user && (
            <Button render={<Link to="/admin" />}>Open dashboard</Button>
          )}
          <Button render={<a href="#report" />} variant="outline">
            Report a problem
          </Button>
        </div>
      </section>

      <section
        id="report"
        className="scroll-mt-24 border-t bg-muted/40 py-16"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Report a problem
            </h2>
            <p className="mt-2 text-muted-foreground">
              Let us know what needs attention and we will route a technician to
              the right site.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <Card key={title}>
                  <CardHeader>
                    <Icon className="size-6 text-primary" />
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send a service request</CardTitle>
              <CardDescription>We will follow up with your assigned technician.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Subject</Label>
                  <Input id="title" placeholder="What is the issue?" {...register('title', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Property name or address" {...register('location')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    defaultValue="medium"
                    onValueChange={(value) => setValue('priority', value as WorkOrderPriority)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Details</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the problem"
                    {...register('description')}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting…' : user ? 'Submit request' : 'Continue to sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FieldService
      </footer>
    </div>
  )
}

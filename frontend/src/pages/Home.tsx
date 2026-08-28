import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Globe,
  MapPin,
  Quote,
  ShieldCheck,
  Star,
} from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
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
import { Reveal } from '@/components/app/reveal'
import type { WorkOrderPriority } from '@/lib/api/types'

interface ReportFormValues {
  title: string
  description: string
  priority: WorkOrderPriority
  location: string
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Report an issue', href: '#report' },
]

const stats = [
  { value: '6.2k+', label: 'Work orders completed' },
  { value: '40+', label: 'Field technicians' },
  { value: '98%', label: 'On-time resolution' },
  { value: '24/7', label: 'Customer support' },
]

const trustedBy = [
  'EURL El Amel',
  'SARL Horizon Vert',
  'SARL Marhaba Immobilier',
  'EURL Tidjani Fils',
]

const features = [
  {
    icon: ClipboardCheck,
    title: 'Tracked service requests',
    description: 'Follow every work order through a clear, audited lifecycle from report to resolution.',
  },
  {
    icon: MapPin,
    title: 'Geolocated field sites',
    description: 'Technicians see exactly where each job is on an interactive map of your sites.',
  },
  {
    icon: BellRing,
    title: 'SLAs and escalations',
    description: 'Overdue and urgent work stays front and center so nothing slips through.',
  },
  {
    icon: BarChart3,
    title: 'Live dashboards',
    description: 'Monitor workload, resolution times, and parts consumption in real time.',
  },
  {
    icon: Globe,
    title: 'Multi-site operations',
    description: 'Keep every customer location, asset, and technician organized in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Admin, manager, technician, and customer roles control exactly who does what.',
  },
]

const steps = [
  { number: '01', title: 'Report the issue', description: 'Submit a request from any site, or have your team log it in the console.' },
  { number: '02', title: 'Get it assigned', description: 'A manager routes the work order to the right technician by skill and location.' },
  { number: '03', title: 'Resolve & report', description: 'The technician completes the job and closes it with a full service report.' },
]

const valueProps = [
  'One audited source of truth for every field operation',
  'Automated assignment by skill, location, and workload',
  'Real-time visibility from dispatch to completion',
  'Secure JWT authentication with role-based access',
]

const plans = [
  {
    name: 'Starter',
    price: '49',
    period: 'per month',
    description: 'For small teams getting started with field service.',
    features: ['Up to 5 technicians', '50 work orders / month', 'Email support', 'Basic dashboards'],
    highlight: false,
  },
  {
    name: 'Business',
    price: '149',
    period: 'per month',
    description: 'For growing operations that need the full toolkit.',
    features: ['Unlimited technicians', 'Unlimited work orders', 'Live dashboard & maps', 'SLA escalations', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'tailored to you',
    description: 'For large, multi-site organizations with complex needs.',
    features: ['Everything in Business', 'Dedicated account manager', 'Custom integrations', 'SSO & audit exports'],
    highlight: false,
  },
]

const testimonials = [
  {
    quote:
      'FieldService took our dispatching from spreadsheets to a single live board. Our on-time rate jumped almost overnight.',
    name: 'Karim Benali',
    role: 'Operations Manager, EURL El Amel',
  },
  {
    quote:
      'The technicians love the map view and the clear work order flow. It is easy to see what is next and where to go.',
    name: 'Yasmine Khelifi',
    role: 'Field Supervisor, SARL Horizon Vert',
  },
  {
    quote:
      'Role-based access and the audit trail give us total control and full accountability over every service call.',
    name: 'Nassim Sadi',
    role: 'Director, SARL Marhaba Immobilier',
  },
]

const faqs = [
  { q: 'How does work order assignment work?', a: 'Managers can assign a job manually or let the system match the nearest qualified technician by skill and current workload.' },
  { q: 'Can technicians update jobs in the field?', a: 'Yes. Technicians can accept, start, and complete work orders and submit service reports from any device with a browser.' },
  { q: 'Do customers and managers both get access?', a: 'Yes. Each role has a tailored interface and permissions: admins and managers configure the system, technicians run jobs, and customers view their own requests.' },
  { q: 'How are SLAs and escalations handled?', a: 'Overdue work orders are automatically flagged and surfaced at the top of the dashboard, and priority alerts are escalated for immediate attention.' },
  { q: 'Is my data secure?', a: 'We use JWT authentication, role-based access control, and a full audit log so every change is tracked and attributable.' },
]

const clients = [
  'Started with 3 technicians in one city',
  'Now coordinating 40+ technicians across 4 wilayas',
  'Processed more than 6,200 field service jobs',
  'Maintaining a 98% on-time resolution rate',
]

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [email, setEmail] = useState('')
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
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight">FieldService</span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button
                className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                render={<Link to="/admin" />}
              >
                Dashboard <ArrowRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                render={<Link to="/login" />}
              >
                Sign in <ArrowRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="border-b">
        <Reveal>
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:py-24 lg:grid-cols-2">
            <div className="text-left">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Run every field job from{' '}
              <span className="text-yellow-500">report to resolution</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Dispatch technicians, manage work orders, track inventory, and keep
              every customer site running — all from one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Button
                  size="lg"
                  className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                  render={<Link to="/admin" />}
                >
                  Open dashboard <ArrowRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                  render={<Link to="/login" />}
                >
                  Get started <ArrowRight className="ml-1 size-4" />
                </Button>
              )}
              <Button size="lg" variant="outline" render={<a href="#how-it-works" />}>
                See how it works
              </Button>
            </div>
          </div>

          <img
            src="/hero.jpg"
            alt="Field service technician repairing industrial equipment"
            className="aspect-video w-full rounded-2xl border-2 border-yellow-400 object-cover"
          />
          </div>
        </Reveal>
      </section>

      <section className="border-b bg-muted/40 py-10">
        <Reveal>
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="text-sm text-muted-foreground">Trusted by operations teams at</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-muted-foreground">
              {trustedBy.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="stats" className="scroll-mt-20 border-b py-16">
        <Reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center lg:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-extrabold tracking-tight text-yellow-600">{value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="features" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                Features
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your field team needs
              </h2>
              <p className="mt-4 text-muted-foreground">
                A complete toolkit to keep your operations organized, visible, and
                moving forward.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 100}>
                <Card>
                  <CardHeader>
                    <span className="grid size-11 place-items-center rounded-lg bg-yellow-400 text-yellow-950">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{description}</CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                How it works
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three simple steps
              </h2>
            </div>
          </Reveal>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            {steps.map(({ number, title, description }, index) => (
              <Reveal key={number} delay={index * 100}>
                <div className="relative text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-full bg-yellow-400 text-lg font-bold text-yellow-950">
                    {number}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                Built for operations
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Field service software that belongs to every business
              </h2>
              <p className="mt-4 text-muted-foreground">
                From a single-site shop to a nationwide field operation, FieldService
                scales with you — without re-training your team.
              </p>
              <ul className="mt-8 space-y-3">
                {valueProps.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-yellow-400 text-yellow-950">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="grid gap-4 sm:grid-cols-2">
              {clients.map((text) => (
                <Card key={text} className="border-none bg-muted/40">
                  <CardContent className="flex items-start gap-3 p-5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-yellow-600" />
                    <span className="text-muted-foreground">{text}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                Pricing
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent plans
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start free and upgrade as your field operation grows.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 100}>
                <Card className={plan.highlight ? 'border-2 border-yellow-400' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-yellow-600" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardContent>
                  {user ? (
                    <Button
                      className="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                      render={<Link to="/admin" />}
                    >
                      Get started <ArrowRight className="ml-1 size-4" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                      render={<Link to="/login" />}
                    >
                      Choose {plan.name} <ArrowRight className="ml-1 size-4" />
                    </Button>
                  )}
                </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                Testimonials
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Our clients say about us
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map(({ quote, name, role }, index) => (
              <Reveal key={name} delay={index * 100}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="size-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="mt-4 size-6 text-yellow-600" />
                    <p className="mt-3 text-sm text-muted-foreground">“{quote}”</p>
                    <div className="mt-5 border-t pt-4">
                      <div className="text-sm font-semibold">{name}</div>
                      <div className="text-xs text-muted-foreground">{role}</div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                FAQ
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Have any questions?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to know about the product and billing.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 space-y-3">
            {faqs.map(({ q, a }, index) => {
              const open = openFaq === index
              return (
                <Card key={q}>
                  <CardContent className="p-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                      onClick={() => setOpenFaq(open ? null : index)}
                    >
                      <span className="font-medium">{q}</span>
                      <ChevronDown
                        className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <Separator />

      <section id="report" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
                Get help
              </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Report a problem
            </h2>
            <p className="mt-4 text-muted-foreground">
              Let us know what needs attention and we will route a technician to
              the right site, fast.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {features.slice(0, 3).map(({ icon: Icon, title, description }) => (
                <Card key={title}>
                  <CardHeader>
                    <Icon className="size-6 text-yellow-600" />
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
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
                  <Button
                    type="submit"
                    className="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : user ? 'Submit request' : 'Continue to sign in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="border-t bg-yellow-400 py-14 text-yellow-950">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Supercharge your growing operations
              </h2>
              <p className="mt-2 text-yellow-950/70">
                Subscribe to our newsletter for field service tips and product updates.
              </p>
            </div>
            <form
              className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                toast.success('Subscribed')
                setEmail('')
              }}
            >
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Button type="submit" variant="secondary" className="shrink-0 text-yellow-950">
                Subscribe
              </Button>
            </form>
          </div>
        </Reveal>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-semibold text-foreground">FieldService</span>
          <span>© {new Date().getFullYear()} FieldService. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

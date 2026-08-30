import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast.service';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { sharedUi } from '../../shared/ui';
import { WorkOrderPriority, User } from '../../core/api/types';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Report an issue', href: '#report' },
];

const stats = [
  { value: '6.2k+', label: 'Work orders completed' },
  { value: '40+', label: 'Field technicians' },
  { value: '98%', label: 'On-time resolution' },
  { value: '24/7', label: 'Customer support' },
];

const trustedBy = ['EURL El Amel', 'SARL Horizon Vert', 'SARL Marhaba Immobilier', 'EURL Tidjani Fils'];

const features: Feature[] = [
  {
    icon: 'clipboardCheck',
    title: 'Tracked service requests',
    description: 'Follow every work order through a clear, audited lifecycle from report to resolution.',
  },
  {
    icon: 'mapPin',
    title: 'Geolocated field sites',
    description: 'Technicians see exactly where each job is on an interactive map of your sites.',
  },
  {
    icon: 'bellRing',
    title: 'SLAs and escalations',
    description: 'Overdue and urgent work stays front and center so nothing slips through.',
  },
  {
    icon: 'barChart3',
    title: 'Live dashboards',
    description: 'Monitor workload, resolution times, and parts consumption in real time.',
  },
  {
    icon: 'globe',
    title: 'Multi-site operations',
    description: 'Keep every customer location, asset, and technician organized in one place.',
  },
  {
    icon: 'shieldCheck',
    title: 'Role-based access',
    description: 'Admin, manager, technician, and customer roles control exactly who does what.',
  },
  {
    icon: 'upload',
    title: 'Excel/CSV import & export',
    description: 'Import 20k customers via streaming (CSV+XLSX, header validation, dup skip/overwrite) and export 2M rows with 0.5MB vs 4.4GB RAM comparison.',
  },
  {
    icon: 'globe',
    title: 'Demo mode + streaming',
    description: 'Netlify demo runs local-only mutations (refresh restores) and shows live RAM delta via psutil + StreamingHttpResponse.',
  },
];

const steps = [
  { number: '01', title: 'Report the issue', description: 'Submit a request from any site, or have your team log it in the console.' },
  { number: '02', title: 'Get it assigned', description: 'A manager routes the work order to the right technician by skill and location.' },
  { number: '03', title: 'Resolve & report', description: 'The technician completes the job and closes it with a full service report.' },
];

const valueProps = [
  'One audited source of truth for every field operation',
  'Automated assignment by skill, location, and workload',
  'Real-time visibility from dispatch to completion',
  'Secure JWT authentication with role-based access',
];

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
}

const plans: Plan[] = [
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
];

const testimonials = [
  {
    quote: 'FieldService took our dispatching from spreadsheets to a single live board. Our on-time rate jumped almost overnight.',
    name: 'Karim Benali',
    role: 'Operations Manager, EURL El Amel',
  },
  {
    quote: 'The technicians love the map view and the clear work order flow. It is easy to see what is next and where to go.',
    name: 'Yasmine Khelifi',
    role: 'Field Supervisor, SARL Horizon Vert',
  },
  {
    quote: 'Role-based access and the audit trail give us total control and full accountability over every service call.',
    name: 'Nassim Sadi',
    role: 'Director, SARL Marhaba Immobilier',
  },
];

const faqs = [
  { q: 'How does work order assignment work?', a: 'Managers can assign a job manually or let the system match the nearest qualified technician by skill and current workload.' },
  { q: 'Can technicians update jobs in the field?', a: 'Yes. Technicians can accept, start, and complete work orders and submit service reports from any device with a browser.' },
  { q: 'Do customers and managers both get access?', a: 'Yes. Each role has a tailored interface and permissions: admins and managers configure the system, technicians run jobs, and customers view their own requests.' },
  { q: 'How are SLAs and escalations handled?', a: 'Overdue work orders are automatically flagged and surfaced at the top of the dashboard, and priority alerts are escalated for immediate attention.' },
  { q: 'Is my data secure?', a: 'We use JWT authentication, role-based access control, and a full audit log so every change is tracked and attributable.' },
];

const clients = [
  'Started with 3 technicians in one city',
  'Now coordinating 40+ technicians across 4 wilayas',
  'Processed more than 6,200 field service jobs',
  'Maintaining a 98% on-time resolution rate',
];

const priorities: { value: WorkOrderPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

@Component({
  selector: 'app-home',
  imports: [NgIcon, RevealDirective, RouterLink, FormsModule, ...sharedUi],
  template: `
    <div class="min-h-svh bg-background">
      <header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span class="text-lg font-bold tracking-tight">FieldService</span>
          <nav class="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            @for (link of navLinks; track link.href) {
              <a [href]="link.href" class="transition-colors hover:text-foreground">{{ link.label }}</a>
            }
          </nav>
          <div class="flex items-center gap-2">
            @if (user()) {
              <a appButton routerLink="/admin" class="bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                Dashboard <ng-icon name="arrowRight" class="ml-1" size="16" />
              </a>
            } @else {
              <a appButton routerLink="/login" class="bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                Sign in <ng-icon name="arrowRight" class="ml-1" size="16" />
              </a>
            }
          </div>
        </div>
      </header>

      <section class="border-b">
        <div appReveal>
          <div class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:py-24 lg:grid-cols-2">
            <div class="text-left">
              <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl">
                Run every field job from <span class="text-yellow-500">report to resolution</span>
              </h1>
              <p class="mt-6 max-w-xl text-lg text-muted-foreground">
                Dispatch technicians by skill and proximity, run work orders through an audited lifecycle, track parts and inventory, map every site, and import/export millions of customers via streaming — all from one place. Built for Algerian field teams, scales to 2M+ records.
              </p>
              <div class="mt-4 flex max-w-xl flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                <span class="rounded-full bg-muted px-2.5 py-1">Work orders + SLA</span>
                <span class="rounded-full bg-muted px-2.5 py-1">Technicians + sites map</span>
                <span class="rounded-full bg-muted px-2.5 py-1">CSV/XLSX import/export</span>
                <span class="rounded-full bg-muted px-2.5 py-1">RBAC + audit log</span>
                <span class="rounded-full bg-muted px-2.5 py-1">Generator streaming (0.5MB vs 4.4GB)</span>
              </div>
              <div class="mt-8 flex flex-wrap gap-3">
                @if (user()) {
                  <a appButton size="lg" routerLink="/admin" class="bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                    Open dashboard <ng-icon name="arrowRight" class="ml-1" size="16" />
                  </a>
                } @else {
                  <a appButton size="lg" routerLink="/login" class="bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                    Get started <ng-icon name="arrowRight" class="ml-1" size="16" />
                  </a>
                }
                <a appButton size="lg" variant="outline" href="#how-it-works">See how it works</a>
              </div>
            </div>
            <img
              src="/hero.jpg"
              alt="Field service technician repairing industrial equipment"
              class="aspect-video w-full rounded-2xl border-2 border-yellow-400 object-cover"
            />
          </div>
        </div>
      </section>

      <section class="border-b bg-muted/40 py-10">
        <div appReveal>
          <div class="mx-auto max-w-6xl px-4 text-center">
            <p class="text-sm text-muted-foreground">Trusted by operations teams at</p>
            <div class="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-muted-foreground">
              @for (name of trustedBy; track name) {
                <span>{{ name }}</span>
              }
            </div>
          </div>
        </div>
      </section>

      <section id="stats" class="scroll-mt-20 border-b py-16">
        <div appReveal>
          <div class="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center lg:grid-cols-4">
            @for (stat of stats; track stat.label) {
              <div>
                <div class="text-4xl font-extrabold tracking-tight text-yellow-600">{{ stat.value }}</div>
                <div class="mt-2 text-sm text-muted-foreground">{{ stat.label }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <section id="features" class="scroll-mt-20 py-20">
        <div class="mx-auto max-w-6xl px-4">
          <div appReveal>
            <div class="mx-auto max-w-2xl text-center">
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">Features</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything your field team needs</h2>
              <p class="mt-4 text-muted-foreground">
                A complete toolkit to keep your operations organized, visible, and moving forward.
              </p>
            </div>
          </div>
          <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (feature of features; track feature.title; let i = $index) {
              <div appReveal [delay]="i * 100">
                <app-card>
                  <app-card-header>
                    <span class="grid size-11 place-items-center rounded-lg bg-yellow-400 text-yellow-950">
                      <ng-icon [name]="feature.icon" size="20" />
                    </span>
                    <app-card-title class="text-lg">{{ feature.title }}</app-card-title>
                  </app-card-header>
                  <app-card-content>
                    <app-card-description>{{ feature.description }}</app-card-description>
                  </app-card-content>
                </app-card>
              </div>
            }
          </div>
        </div>
      </section>

      <section id="how-it-works" class="scroll-mt-20 border-t bg-muted/40 py-20">
        <div class="mx-auto max-w-6xl px-4">
          <div appReveal>
            <div class="mx-auto max-w-2xl text-center">
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">How it works</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Three simple steps</h2>
            </div>
          </div>
          <div class="relative mt-12 grid gap-8 md:grid-cols-3">
            @for (step of steps; track step.number; let i = $index) {
              <div appReveal [delay]="i * 100">
                <div class="relative text-center">
                  <div class="mx-auto grid size-14 place-items-center rounded-full bg-yellow-400 text-lg font-bold text-yellow-950">
                    {{ step.number }}
                  </div>
                  <h3 class="mt-4 text-lg font-semibold">{{ step.title }}</h3>
                  <p class="mt-2 text-sm text-muted-foreground">{{ step.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="border-b py-20">
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div appReveal>
            <div>
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">Built for operations</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Field service software that belongs to every business
              </h2>
              <p class="mt-4 text-muted-foreground">
                From a single-site shop to a nationwide field operation, FieldService scales with you —
                without re-training your team.
              </p>
              <ul class="mt-8 space-y-3">
                @for (text of valueProps; track text) {
                  <li class="flex items-start gap-3 text-sm">
                    <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-yellow-400 text-yellow-950">
                      <ng-icon name="check" size="14" />
                    </span>
                    <span class="text-muted-foreground">{{ text }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
          <div appReveal [delay]="150">
            <div class="grid gap-4 sm:grid-cols-2">
              @for (text of clients; track text) {
                <app-card class="border-none bg-muted/40">
                  <app-card-content class="flex items-start gap-3 p-5 text-sm">
                    <ng-icon name="checkCircle2" class="mt-0.5 shrink-0 text-yellow-600" size="20" />
                    <span class="text-muted-foreground">{{ text }}</span>
                  </app-card-content>
                </app-card>
              }
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" class="scroll-mt-20 py-20">
        <div class="mx-auto max-w-6xl px-4">
          <div appReveal>
            <div class="mx-auto max-w-2xl text-center">
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">Pricing</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent plans</h2>
              <p class="mt-4 text-muted-foreground">Start free and upgrade as your field operation grows.</p>
            </div>
          </div>
          <div class="mt-12 grid gap-6 lg:grid-cols-3">
            @for (plan of plans; track plan.name; let i = $index) {
              <div appReveal [delay]="i * 100">
                <app-card [class.border-2]="plan.highlight" [class.border-yellow-400]="plan.highlight">
                  <app-card-header>
                    <app-card-title class="text-lg">{{ plan.name }}</app-card-title>
                    <div class="mt-2 flex items-baseline gap-1">
                      <span class="text-4xl font-extrabold tracking-tight">{{ plan.price }}</span>
                      <span class="text-sm text-muted-foreground">{{ plan.period }}</span>
                    </div>
                    <app-card-description>{{ plan.description }}</app-card-description>
                  </app-card-header>
                  <app-card-content>
                    <ul class="space-y-2.5">
                      @for (feature of plan.features; track feature) {
                        <li class="flex items-start gap-2.5 text-sm">
                          <ng-icon name="check" class="mt-0.5 shrink-0 text-yellow-600" size="16" />
                          <span class="text-muted-foreground">{{ feature }}</span>
                        </li>
                      }
                    </ul>
                  </app-card-content>
                  <app-card-content>
                    @if (user()) {
                      <a appButton routerLink="/admin" class="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                        Get started <ng-icon name="arrowRight" class="ml-1" size="16" />
                      </a>
                    } @else {
                      <a appButton routerLink="/login" class="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300">
                        Choose {{ plan.name }} <ng-icon name="arrowRight" class="ml-1" size="16" />
                      </a>
                    }
                  </app-card-content>
                </app-card>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="border-t bg-muted/40 py-20">
        <div class="mx-auto max-w-6xl px-4">
          <div appReveal>
            <div class="mx-auto max-w-2xl text-center">
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">Testimonials</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Our clients say about us</h2>
            </div>
          </div>
          <div class="mt-12 grid gap-4 md:grid-cols-3">
            @for (testimonial of testimonials; track testimonial.name; let i = $index) {
              <div appReveal [delay]="i * 100">
                <app-card>
                  <app-card-content class="p-6">
                    <div class="flex gap-0.5">
                      @for (star of [0, 1, 2, 3, 4]; track star) {
                        <ng-icon name="star" size="16" class="fill-yellow-400 text-yellow-400" />
                      }
                    </div>
                    <ng-icon name="quote" class="mt-4 text-yellow-600" size="24" />
                    <p class="mt-3 text-sm text-muted-foreground">“{{ testimonial.quote }}”</p>
                    <div class="mt-5 border-t pt-4">
                      <div class="text-sm font-semibold">{{ testimonial.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ testimonial.role }}</div>
                    </div>
                  </app-card-content>
                </app-card>
              </div>
            }
          </div>
        </div>
      </section>

      <section id="faq" class="scroll-mt-20 py-20">
        <div class="mx-auto max-w-3xl px-4">
          <div appReveal>
            <div class="text-center">
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">FAQ</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Have any questions?</h2>
              <p class="mt-4 text-muted-foreground">Everything you need to know about the product and billing.</p>
            </div>
          </div>
          <div class="mt-12 space-y-6">
            @for (faq of faqs; track faq.q; let i = $index) {
              <app-card>
                <app-card-content class="p-0">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-4 p-5 text-left"
                    (click)="toggleFaq(i)"
                  >
                    <span class="font-medium">{{ faq.q }}</span>
                    <ng-icon
                      name="chevronDown"
                      size="20"
                      class="shrink-0 text-muted-foreground transition-transform duration-300"
                      [class.rotate-180]="openFaq() === i"
                    />
                  </button>
                  <div
                    class="grid transition-all duration-300 ease-in-out"
                    [class.grid-rows-[1fr]]="openFaq() === i"
                    [class.grid-rows-[0fr]]="openFaq() !== i"
                    [class.opacity-100]="openFaq() === i"
                    [class.opacity-0]="openFaq() !== i"
                  >
                    <div class="overflow-hidden">
                      <div class="px-5 pb-5 text-sm text-muted-foreground">{{ faq.a }}</div>
                    </div>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        </div>
      </section>

      <div class="border-t"></div>

      <section id="report" class="scroll-mt-20 py-20">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div appReveal>
            <div>
              <span class="text-sm font-semibold uppercase tracking-widest text-yellow-600">Get help</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Report a problem</h2>
              <p class="mt-4 text-muted-foreground">
                Let us know what needs attention and we will route a technician to the right site, fast.
              </p>
              <div class="mt-8 grid gap-4 sm:grid-cols-3">
                @for (feature of features.slice(0, 3); track feature.title) {
                  <app-card>
                    <app-card-header>
                      <ng-icon [name]="feature.icon" class="text-yellow-600" size="24" />
                      <app-card-title class="text-base">{{ feature.title }}</app-card-title>
                    </app-card-header>
                    <app-card-content>
                      <app-card-description>{{ feature.description }}</app-card-description>
                    </app-card-content>
                  </app-card>
                }
              </div>
            </div>
          </div>

          <div appReveal [delay]="150">
            <app-card>
              <app-card-header>
                <app-card-title>Send a service request</app-card-title>
                <app-card-description>We will follow up with your assigned technician.</app-card-description>
              </app-card-header>
              <app-card-content>
                <form (ngSubmit)="submit()" class="space-y-4">
                  <div class="space-y-2">
                    <label appLabel for="title">Subject</label>
                    <input appInput id="title" placeholder="What is the issue?" [(ngModel)]="form.title" name="title" />
                  </div>
                  <div class="space-y-2">
                    <label appLabel for="location">Location</label>
                    <input appInput id="location" placeholder="Property name or address" [(ngModel)]="form.location" name="location" />
                  </div>
                  <div class="space-y-2">
                    <label appLabel for="priority">Priority</label>
                    <select appSelect id="priority" [(ngModel)]="form.priority" name="priority">
                      @for (priority of priorities; track priority.value) {
                        <option [value]="priority.value">{{ priority.label }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label appLabel for="description">Details</label>
                    <textarea appTextarea id="description" rows="4" placeholder="Describe the problem" [(ngModel)]="form.description" name="description"></textarea>
                  </div>
                  <button
                    appButton
                    type="submit"
                    class="w-full bg-yellow-400 text-yellow-950 hover:bg-yellow-300"
                    [disabled]="submitting()"
                  >
                    {{ submitting() ? 'Submitting…' : user() ? 'Submit request' : 'Continue to sign in' }}
                  </button>
                </form>
              </app-card-content>
            </app-card>
          </div>
        </div>
      </section>

      <section class="border-t bg-yellow-400 py-14 text-yellow-950">
        <div appReveal>
          <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 class="text-2xl font-bold tracking-tight">Supercharge your growing operations</h2>
              <p class="mt-2 text-yellow-950/70">
                Subscribe to our newsletter for field service tips and product updates.
              </p>
            </div>
            <form
              class="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
              (ngSubmit)="subscribe()"
            >
              <input appInput type="email" placeholder="Your email address" [(ngModel)]="email" name="email" required />
              <button type="submit" appButton variant="secondary" class="shrink-0 text-yellow-950">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      <footer class="border-t py-10">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <span class="font-semibold text-foreground">FieldService</span>
          <span>© {{ year }} FieldService. All rights reserved.</span>
          <div class="flex flex-wrap items-center justify-center gap-4">
            @for (link of navLinks; track link.href) {
              <a [href]="link.href" class="transition-colors hover:text-foreground">{{ link.label }}</a>
            }
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  protected readonly navLinks = navLinks;
  protected readonly stats = stats;
  protected readonly trustedBy = trustedBy;
  protected readonly features = features;
  protected readonly steps = steps;
  protected readonly valueProps = valueProps;
  protected readonly plans = plans;
  protected readonly testimonials = testimonials;
  protected readonly faqs = faqs;
  protected readonly clients = clients;
  protected readonly priorities = priorities;
  protected readonly year = new Date().getFullYear();

  protected readonly openFaq = signal<number | null>(0);
  protected readonly submitting = signal(false);
  protected email = '';

  protected form = {
    title: '',
    description: '',
    priority: 'medium' as WorkOrderPriority,
    location: '',
  };

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  user(): User | null {
    return this.auth.user();
  }

  ngOnInit(): void {
    this.auth.init();
  }

  toggleFaq(index: number): void {
    this.openFaq.set(this.openFaq() === index ? null : index);
  }

  async submit(): Promise<void> {
    if (!this.user()) {
      this.toast.success('Sign in to submit a service request');
      window.location.href = '/login';
      return;
    }
    this.submitting.set(true);
    try {
      await lastValueFrom(
        this.api.post('/work-orders/', {
          title: this.form.title,
          description: `${this.form.location ? `${this.form.location}\n\n` : ''}${this.form.description}`,
          priority: this.form.priority,
        }),
      );
      this.toast.success('Service request submitted');
      this.form = { title: '', description: '', priority: 'medium', location: '' };
    } catch (error) {
      this.toast.error(apiErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  subscribe(): void {
    this.toast.success('Subscribed');
    this.email = '';
  }
}

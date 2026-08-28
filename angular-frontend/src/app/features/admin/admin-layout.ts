import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import { RoleBadgeComponent } from '../../shared/status-badge';
import { DEMO_MODE } from '../../core/demo';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const managementNav: NavItem[] = [
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/customers', label: 'Customers', icon: 'building2' },
  { to: '/admin/sites', label: 'Sites', icon: 'mapPin' },
  { to: '/admin/assets', label: 'Assets', icon: 'boxes' },
  { to: '/admin/technicians', label: 'Technicians', icon: 'wrench' },
];

const serviceNav: NavItem[] = [
  { to: '/admin/work-orders', label: 'Work Orders', icon: 'clipboardList' },
  { to: '/admin/service-reports', label: 'Service Reports', icon: 'fileText' },
];

const inventoryNav: NavItem[] = [{ to: '/admin/parts', label: 'Parts', icon: 'package' }];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, RoleBadgeComponent],
  template: `
    <div class="flex min-h-svh bg-muted/30">
      <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <div class="flex items-center gap-2 border-b px-3 py-3">
          <span class="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ng-icon name="wrench" size="16" />
          </span>
          <div class="truncate text-sm font-semibold">FieldService</div>
        </div>

        <nav class="flex-1 overflow-y-auto p-3">
          <a
            routerLink="/admin"
            routerLinkActive="bg-accent text-accent-foreground"
            [routerLinkActiveOptions]="{ exact: true }"
            class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ng-icon name="layoutDashboard" size="16" /> Dashboard
          </a>

          @if (canManage) {
            @if (isAdmin) {
              <div class="mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Administration
              </div>
              @for (item of managementNav; track item.to) {
                <a
                  routerLink="{{ item.to }}"
                  routerLinkActive="bg-accent text-accent-foreground"
                  class="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ng-icon [name]="item.icon" size="16" /> {{ item.label }}
                </a>
              }
            }

            <div class="mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Inventory
            </div>
            <a
              routerLink="/admin/parts"
              routerLinkActive="bg-accent text-accent-foreground"
              class="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon name="package" size="16" /> Parts
            </a>
          }

          <div class="mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Service
          </div>
          @for (item of serviceNav; track item.to) {
            <a
              routerLink="{{ item.to }}"
              routerLinkActive="bg-accent text-accent-foreground"
              class="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon [name]="item.icon" size="16" /> {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex min-h-svh flex-1 flex-col md:pl-64">
        <header class="flex h-14 items-center justify-end gap-2 border-b bg-background px-4">
          <div class="relative">
            <button
              class="flex items-center gap-2 rounded-full py-1 outline-none ring-ring focus-visible:ring-2"
              (click)="menuOpen.set(!menuOpen())"
            >
              <div
                class="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                {{ initials(username()) }}
              </div>
            </button>

            @if (menuOpen()) {
              <div class="absolute right-0 top-12 z-50 w-64 rounded-md border bg-background shadow-lg" (click)="menuOpen.set(false)">
                <div class="border-b px-4 py-3">
                  <div class="font-medium">{{ username() }}</div>
                  @if (email()) {
                    <div class="truncate text-xs text-muted-foreground">{{ email() }}</div>
                  }
                  @if (user()) {
                    <div class="mt-1"><span appRoleBadge [role]="user()!.role"></span></div>
                  }
                </div>
                <a
                  routerLink="/admin/account"
                  class="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                >
                  <ng-icon name="settings" size="16" /> Account settings
                </a>
                <button
                  class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                  (click)="signOut()"
                >
                  <ng-icon name="logOut" size="16" /> Sign out
                </button>
              </div>
            }
          </div>
        </header>

        @if (demoMode) {
          <div class="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-black">
            Demo mode — edits are local only, refresh restores original data.
          </div>
        }
        <main class="flex-1 space-y-4 overflow-auto p-4 lg:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected readonly managementNav = managementNav;
  protected readonly serviceNav = serviceNav;
  protected readonly menuOpen = signal(false);
  protected readonly demoMode = DEMO_MODE;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.auth.init();
  }

  user() {
    return this.auth.user();
  }
  get canManage() {
    return this.auth.hasRole(['admin', 'manager']);
  }
  get isAdmin() {
    return this.auth.user()?.role === 'admin';
  }

  username(): string {
    const u = this.auth.user();
    if (!u) return '';
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
  }

  email(): string | null {
    return this.auth.user()?.email ?? null;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

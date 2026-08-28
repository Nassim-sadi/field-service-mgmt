import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQuery, injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import {
  Asset,
  Customer,
  Paginated,
  Site,
  Technician,
  WorkOrder,
  WorkOrderPriority,
} from '../../core/api/types';
import { AuthService } from '../../core/auth/auth.service';
import {
  ButtonDirective,
  CardComponent,
  CardContentComponent,
  DialogComponent,
  InputDirective,
  LabelDirective,
  PageHeaderComponent,
  PaginatedFooterComponent,
  SelectDirective,
  SheetComponent,
  TableBodyComponent,
  TableCellComponent,
  TableComponent,
  TableHeadComponent,
  TableHeaderComponent,
  TableRowComponent,
  TextareaDirective,
  ViewActionComponent,
} from '../../shared/ui';
import { PriorityBadgeComponent, StatusBadgeComponent } from '../../shared/status-badge';
import { ToastService } from '../../core/toast.service';

interface CreateForm {
  customer: string;
  site: string;
  asset: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  due_at: string;
}

const emptyCreateForm = (): CreateForm => ({
  customer: '',
  site: '',
  asset: '',
  title: '',
  description: '',
  priority: 'medium',
  due_at: '',
});

interface ActionSpec {
  url: string;
  label: string;
  icon: string;
}

const actionFor: Record<string, ActionSpec> = {
  accepted: { url: 'accept', label: 'Accept', icon: 'check' },
  in_progress: { url: 'start', label: 'Start', icon: 'play' },
  completed: { url: 'complete', label: 'Complete', icon: 'checkCheck' },
};

const statusFilterOptions: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorities: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent'];

interface ConfirmTarget {
  id: number;
  url: string;
  label: string;
  number: string;
}

@Component({
  selector: 'app-work-orders',
  imports: [
    FormsModule,
    NgIcon,
    DatePipe,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    SelectDirective,
    TextareaDirective,
    CardComponent,
    CardContentComponent,
    TableComponent,
    TableHeaderComponent,
    TableBodyComponent,
    TableRowComponent,
    TableHeadComponent,
    TableCellComponent,
    PaginatedFooterComponent,
    ViewActionComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    DialogComponent,
    SheetComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Work Orders" description="Service requests and field dispatches">
        @if (isManagement()) {
          <button appButton (click)="openCreate()">
            <ng-icon name="plus" size="16" /> New work order
          </button>
        }
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input appInput placeholder="Search work orders…" class="max-w-sm" [ngModel]="search()" (ngModelChange)="search.set($event)" />
            <select appSelect class="w-48" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              @for (option of statusFilterOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Number</th>
                <th appTableHead>Title</th>
                <th appTableHead>Customer</th>
                <th appTableHead>Technician</th>
                <th appTableHead>Priority</th>
                <th appTableHead>Status</th>
                <th appTableHead class="w-56">Actions</th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="7" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (order of list.data()?.results ?? []; track order.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-mono text-xs">
                      {{ order.number }}
                      @if (order.is_overdue) {
                        <span class="ml-1 text-destructive">●</span>
                      }
                    </td>
                    <td appTableCell class="font-medium">{{ order.title }}</td>
                    <td appTableCell>{{ order.customer_name }}</td>
                    <td appTableCell>{{ order.assigned_technician_name || '—' }}</td>
                    <td appTableCell><span appPriorityBadge [priority]="order.priority"></span></td>
                    <td appTableCell><span appStatusBadge [status]="order.status"></span></td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(order)"></button>
                        @if (isManagement() && order.status === 'new' && order.available_transitions.includes('assigned')) {
                          <button appButton variant="ghost" size="sm" (click)="openAssign(order)">
                            <ng-icon name="userPlus" size="16" /> Assign
                          </button>
                        }
                        @for (action of transitionsFor(order); track action.url) {
                          <button appButton variant="ghost" size="sm" [disabled]="transition.isPending()" (click)="requestTransition(order, action)">
                            <ng-icon [name]="action.icon" size="16" /> {{ action.label }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="7" class="h-24 text-center text-muted-foreground">No work orders found.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
          <app-paginated-footer
            [count]="list.data()?.count ?? 0"
            [page]="list.page()"
            [pageSize]="list.pageSize()"
            (pageChange)="list.setPage($event)"
            (pageSizeChange)="list.setPageSize($event)"
          ></app-paginated-footer>
        </app-card-content>
      </app-card>

      @if (createOpen()) {
        <app-dialog [open]="createOpen()" (close)="closeCreate()">
          <div appDialogTitle>New work order</div>
          <div appDialogDesc>Create a service request.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="wo-customer">Customer</label>
              <select appSelect id="wo-customer" [(ngModel)]="createForm.customer" name="customer" (ngModelChange)="onCustomerChange()">
                <option value="" disabled>Select customer</option>
                @for (customer of customers.data()?.results ?? []; track customer.id) {
                  <option [value]="customer.id">{{ customer.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="wo-site">Site</label>
              <select appSelect id="wo-site" [(ngModel)]="createForm.site" name="site" [disabled]="!createForm.customer" (ngModelChange)="createForm.asset = ''">
                <option value="" disabled>{{ createForm.customer ? 'Select site' : 'Select customer first' }}</option>
                @for (site of sites.data()?.results ?? []; track site.id) {
                  <option [value]="site.id">{{ site.name }}</option>
                }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="wo-asset">Asset</label>
                <select appSelect id="wo-asset" [(ngModel)]="createForm.asset" name="asset" [disabled]="!createForm.site">
                  <option value="" disabled>{{ createForm.site ? 'Optional' : 'Select site first' }}</option>
                  @for (asset of assets.data()?.results ?? []; track asset.id) {
                    <option [value]="asset.id">{{ asset.name }}</option>
                  }
                </select>
              </div>
              <div class="space-y-2">
                <label appLabel for="wo-priority">Priority</label>
                <select appSelect id="wo-priority" [(ngModel)]="createForm.priority" name="priority">
                  @for (priority of priorities; track priority) {
                    <option [value]="priority">{{ priorityLabel(priority) }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="wo-title">Title</label>
              <input appInput id="wo-title" required [(ngModel)]="createForm.title" name="title" />
            </div>
            <div class="space-y-2">
              <label appLabel for="wo-desc">Description</label>
              <textarea appTextarea id="wo-desc" rows="3" [(ngModel)]="createForm.description" name="description"></textarea>
            </div>
            <div class="space-y-2">
              <label appLabel for="wo-due">Due (optional)</label>
              <input appInput id="wo-due" type="datetime-local" [(ngModel)]="createForm.due_at" name="due_at" />
            </div>
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="closeCreate()">Cancel</button>
            <button appButton [disabled]="createMutation.isPending()" (click)="create()">
              {{ createMutation.isPending() ? 'Saving…' : 'Create' }}
            </button>
          </div>
        </app-dialog>
      }

      @if (assignWorkOrder(); as order) {
        <app-dialog [open]="assignOpen()" (close)="closeAssign()">
          <div appDialogTitle>Assign {{ order.number }}</div>
          <div appDialogDesc>Select a technician for this work order.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="assign-technician">Technician</label>
              <select appSelect id="assign-technician" [(ngModel)]="assignTechnicianId" name="technician">
                <option value="" disabled>Select technician</option>
                @for (technician of technicians.data()?.results ?? []; track technician.id) {
                  <option [value]="technician.id">{{ technician.full_name || technician.username }}</option>
                }
              </select>
            </div>
            @if (assignError()) {
              <p class="text-sm text-destructive">{{ assignError() }}</p>
            }
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="closeAssign()">Cancel</button>
            <button appButton [disabled]="!assignTechnicianId || assignMutation.isPending()" (click)="assign()">
              {{ assignMutation.isPending() ? 'Assigning…' : 'Assign' }}
            </button>
          </div>
        </app-dialog>
      }

      @if (confirm(); as target) {
        <app-dialog [open]="!!confirm()" (close)="confirm.set(null)">
          <div appDialogTitle>Confirm {{ target.label }}</div>
          <div appDialogDesc>
            Are you sure you want to {{ target.label.toLowerCase() }} work order {{ target.number }}? This action cannot be undone.
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="confirm.set(null)">Cancel</button>
            <button appButton [disabled]="transition.isPending()" (click)="runTransition()">
              {{ transition.isPending() ? 'Saving…' : target.label }}
            </button>
          </div>
        </app-dialog>
      }

      @if (detailsOrder(); as order) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ order.number }} · {{ order.title }}</div>
          <div appSheetDesc>{{ order.customer_name }}</div>
          <div appSheetContent class="space-y-4 text-sm">
            <div class="flex gap-2">
              <span appStatusBadge [status]="order.status"></span>
              <span appPriorityBadge [priority]="order.priority"></span>
              @if (order.is_overdue) {
                <span class="text-sm font-medium text-destructive">Overdue</span>
              }
            </div>
            <dl class="space-y-3">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Site</dt>
                <dd class="text-right font-medium">{{ order.site_name }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Asset</dt>
                <dd class="text-right font-medium">{{ order.asset_name || '—' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Technician</dt>
                <dd class="text-right font-medium">{{ order.assigned_technician_name || 'Unassigned' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Opened</dt>
                <dd class="text-right font-medium">{{ order.open_date | date: 'medium' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Due</dt>
                <dd class="text-right font-medium">{{ order.due_at ? (order.due_at | date: 'medium') : '—' }}</dd>
              </div>
              @if (order.completed_at) {
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-muted-foreground">Completed</dt>
                  <dd class="text-right font-medium">{{ order.completed_at | date: 'medium' }}</dd>
                </div>
              }
              @if (order.resolution_minutes != null) {
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-muted-foreground">Resolution</dt>
                  <dd class="text-right font-medium">{{ order.resolution_minutes }} min</dd>
                </div>
              }
            </dl>
            @if (order.description) {
              <div class="space-y-1">
                <div class="text-muted-foreground">Description</div>
                <p class="whitespace-pre-wrap">{{ order.description }}</p>
              </div>
            }
          </div>
        </app-sheet>
      }
    </div>
  `,
})
export class WorkOrdersComponent {
  protected readonly statusFilterOptions = statusFilterOptions;
  protected readonly priorities = priorities;

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();
  private auth = inject(AuthService);

  protected search = signal('');
  protected statusFilter = signal('');

  protected createOpen = signal(false);
  protected assignOpen = signal(false);
  protected detailsOpen = signal(false);
  protected assignWorkOrder = signal<WorkOrder | null>(null);
  protected detailsOrder = signal<WorkOrder | null>(null);
  protected assignTechnicianId = signal('');
  protected assignError = signal('');
  protected confirm = signal<ConfirmTarget | null>(null);
  protected createForm: CreateForm = emptyCreateForm();

  protected extra = signal<Record<string, string | number | null | undefined>>({});
  protected statusParams = computed(() =>
    this.statusFilter() ? { status: this.statusFilter() } : {},
  );
  protected params = computed(() => this.statusParams());

  protected list = pagedList<WorkOrder>({
    url: '/work-orders/',
    queryKey: ['workOrders'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
    extra: this.params,
  });

  protected customers = injectQuery(() => ({
    queryKey: ['customers'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Customer>>('/customers/')),
  }));
  protected sites = injectQuery(() => ({
    queryKey: ['sites', this.createForm.customer],
    enabled: !!this.createForm.customer,
    queryFn: () =>
      lastValueFrom(
        this.api.get<Paginated<Site>>('/sites/', { customer: Number(this.createForm.customer) }),
      ),
  }));
  protected assets = injectQuery(() => ({
    queryKey: ['assets', this.createForm.site],
    enabled: !!this.createForm.site,
    queryFn: () =>
      lastValueFrom(
        this.api.get<Paginated<Asset>>('/assets/', { site: Number(this.createForm.site) }),
      ),
  }));
  protected technicians = injectQuery<Paginated<Technician>>(() => ({
    queryKey: ['technicians', 'active'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Technician>>('/technicians/', { is_active: true })),
  }));

  protected isManagement = computed(() => this.auth.hasRole(['admin', 'manager']));

  protected createMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.api.post('/work-orders/', {
          customer: Number(this.createForm.customer),
          site: Number(this.createForm.site),
          asset: this.createForm.asset ? Number(this.createForm.asset) : null,
          title: this.createForm.title,
          description: this.createForm.description,
          priority: this.createForm.priority,
          due_at: this.createForm.due_at ? new Date(this.createForm.due_at).toISOString() : null,
        }),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      this.toast.success('Work order created');
      this.closeCreate();
      this.createForm = emptyCreateForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected assignMutation = injectMutation(() => ({
    mutationFn: () => {
      const order = this.assignWorkOrder()!;
      return lastValueFrom(
        this.api.post(`/work-orders/${order.id}/assign/`, {
          technician: Number(this.assignTechnicianId()),
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      this.toast.success('Work order assigned');
      this.assignTechnicianId.set('');
      this.assignError.set('');
      this.closeAssign();
    },
    onError: (error) => this.assignError.set(apiErrorMessage(error)),
  }));

  protected transition = injectMutation(() => ({
    mutationFn: () => {
      const target = this.confirm()!;
      return lastValueFrom(this.api.post(`/work-orders/${target.id}/${target.url}/`));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      this.toast.success('Status updated');
      this.confirm.set(null);
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  transitionsFor(order: WorkOrder): ActionSpec[] {
    return order.available_transitions.map((t) => actionFor[t]).filter(Boolean);
  }

  priorityLabel(priority: WorkOrderPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  onCustomerChange(): void {
    this.createForm.site = '';
    this.createForm.asset = '';
  }

  openCreate(): void {
    this.createForm = emptyCreateForm();
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  openAssign(order: WorkOrder): void {
    this.assignWorkOrder.set(order);
    this.assignTechnicianId.set('');
    this.assignError.set('');
    this.assignOpen.set(true);
  }
  closeAssign(): void {
    this.assignOpen.set(false);
  }

  openDetails(order: WorkOrder): void {
    this.detailsOrder.set(order);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  requestTransition(order: WorkOrder, action: ActionSpec): void {
    this.confirm.set({ id: order.id, url: action.url, label: action.label, number: order.number });
  }

  runTransition(): void {
    this.transition.mutate();
  }

  assign(): void {
    this.assignMutation.mutate();
  }

  create(): void {
    if (!this.createForm.customer || !this.createForm.site || !this.createForm.title) return;
    this.createMutation.mutate();
  }
}

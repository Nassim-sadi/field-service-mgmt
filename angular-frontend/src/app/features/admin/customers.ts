import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQuery, injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Company, Customer, Paginated } from '../../core/api/types';
import {
  ButtonDirective,
  CardComponent,
  CardContentComponent,
  DialogComponent,
  EditActionComponent,
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
import { ToastService } from '../../core/toast.service';

interface CustomerForm {
  company: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const emptyForm = (): CustomerForm => ({
  company: '',
  name: '',
  email: '',
  phone: '',
  address: '',
});

const fromCustomer = (c: Customer): CustomerForm => ({
  company: String(c.company),
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address,
});

@Component({
  selector: 'app-customers',
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
    EditActionComponent,
    DialogComponent,
    SheetComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Customers" description="Manage customer accounts">
        <button appButton (click)="openCreate()">
          <ng-icon name="plus" size="16" /> Add customer
        </button>
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search customers…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Name</th>
                <th appTableHead>Company</th>
                <th appTableHead>Email</th>
                <th appTableHead>Phone</th>
                <th appTableHead>Sites</th>
                <th appTableHead class="w-32"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (customer of list.data()?.results ?? []; track customer.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-medium">{{ customer.name }}</td>
                    <td appTableCell>#{{ customer.company }}</td>
                    <td appTableCell>{{ customer.email || '—' }}</td>
                    <td appTableCell>{{ customer.phone || '—' }}</td>
                    <td appTableCell>{{ customer.site_count }}</td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(customer)"></button>
                        <button appEditAction (clicked)="openEdit(customer)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">No customers found.</td>
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
          <div appDialogTitle>New customer</div>
          <div appDialogDesc>Add a customer account.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="customer-company">Company</label>
              <select appSelect id="customer-company" [(ngModel)]="form.company" name="company">
                <option value="" disabled>Select company</option>
                @for (company of companies.data()?.results ?? []; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="customer-name">Name</label>
              <input appInput id="customer-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="space-y-2">
              <label appLabel for="customer-email">Email</label>
              <input appInput id="customer-email" type="email" required [(ngModel)]="form.email" name="email" />
            </div>
            <div class="space-y-2">
              <label appLabel for="customer-phone">Phone</label>
              <input appInput id="customer-phone" [(ngModel)]="form.phone" name="phone" />
            </div>
            <div class="space-y-2">
              <label appLabel for="customer-address">Address</label>
              <textarea appTextarea id="customer-address" rows="3" [(ngModel)]="form.address" name="address"></textarea>
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

      @if (editCustomer(); as customer) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ customer.name }}</div>
          <div appDialogDesc>Update customer information.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="edit-customer-company">Company</label>
              <select appSelect id="edit-customer-company" [(ngModel)]="form.company" name="company">
                @for (company of companies.data()?.results ?? []; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-customer-name">Name</label>
              <input appInput id="edit-customer-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-customer-email">Email</label>
              <input appInput id="edit-customer-email" type="email" required [(ngModel)]="form.email" name="email" />
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-customer-phone">Phone</label>
              <input appInput id="edit-customer-phone" [(ngModel)]="form.phone" name="phone" />
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-customer-address">Address</label>
              <textarea appTextarea id="edit-customer-address" rows="3" [(ngModel)]="form.address" name="address"></textarea>
            </div>
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="closeEdit()">Cancel</button>
            <button appButton [disabled]="editMutation.isPending()" (click)="saveEdit()">
              {{ editMutation.isPending() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </app-dialog>
      }

      @if (detailsCustomer(); as customer) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ customer.name }}</div>
          <div appSheetDesc>Customer details</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Company ID</dt>
              <dd class="font-medium">{{ customer.company }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Email</dt>
              <dd class="font-medium">{{ customer.email || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Phone</dt>
              <dd class="font-medium">{{ customer.phone || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Address</dt>
              <dd class="font-medium">{{ customer.address || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Sites</dt>
              <dd class="font-medium">{{ customer.site_count }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Created</dt>
              <dd class="font-medium">{{ customer.created_at | date }}</dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class CustomersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected createOpen = signal(false);
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editCustomer = signal<Customer | null>(null);
  protected detailsCustomer = signal<Customer | null>(null);
  protected form: CustomerForm = emptyForm();

  protected list = pagedList<Customer>({
    url: '/customers/',
    queryKey: ['customers'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected companies = injectQuery(() => ({
    queryKey: ['companies'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Company>>('/companies/')),
  }));

  protected createMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.api.post('/customers/', {
          company: Number(this.form.company),
          name: this.form.name,
          email: this.form.email,
          phone: this.form.phone,
          address: this.form.address,
        }),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['customers'] });
      this.toast.success('Customer created');
      this.closeCreate();
      this.form = emptyForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const customer = this.editCustomer()!;
      return lastValueFrom(
        this.api.patch(`/customers/${customer.id}/`, {
          company: Number(this.form.company),
          name: this.form.name,
          email: this.form.email,
          phone: this.form.phone,
          address: this.form.address,
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['customers'] });
      this.toast.success('Customer updated');
      this.closeEdit();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  openCreate(): void {
    this.form = emptyForm();
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  openEdit(customer: Customer): void {
    this.editCustomer.set(customer);
    this.form = fromCustomer(customer);
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(customer: Customer): void {
    this.detailsCustomer.set(customer);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  create(): void {
    if (!this.form.company || !this.form.name) return;
    this.createMutation.mutate();
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

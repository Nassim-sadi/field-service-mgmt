import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQuery, injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Customer, Paginated, Site } from '../../core/api/types';
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

interface SiteForm {
  customer: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  contact_name: string;
  contact_phone: string;
}

const emptyForm = (): SiteForm => ({
  customer: '',
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  contact_name: '',
  contact_phone: '',
});

const fromSite = (s: Site): SiteForm => ({
  customer: String(s.customer),
  name: s.name,
  address: s.address,
  latitude: s.latitude != null ? String(s.latitude) : '',
  longitude: s.longitude != null ? String(s.longitude) : '',
  contact_name: s.contact_name,
  contact_phone: s.contact_phone,
});

@Component({
  selector: 'app-sites',
  imports: [
    FormsModule,
    NgIcon,
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
      <app-page-header title="Sites" description="Manage customer sites">
        <button appButton (click)="openCreate()">
          <ng-icon name="plus" size="16" /> Add site
        </button>
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search sites…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Name</th>
                <th appTableHead>Customer</th>
                <th appTableHead>Address</th>
                <th appTableHead>Coordinates</th>
                <th appTableHead>Assets</th>
                <th appTableHead class="w-32"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (site of list.data()?.results ?? []; track site.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-medium">{{ site.name }}</td>
                    <td appTableCell>{{ site.customer_name }}</td>
                    <td appTableCell>{{ site.address || '—' }}</td>
                    <td appTableCell>{{ coords(site) }}</td>
                    <td appTableCell>{{ site.asset_count }}</td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(site)"></button>
                        <button appEditAction (clicked)="openEdit(site)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">No sites found.</td>
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
          <div appDialogTitle>New site</div>
          <div appDialogDesc>Add a customer site.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="site-customer">Customer</label>
              <select appSelect id="site-customer" [(ngModel)]="form.customer" name="customer">
                <option value="" disabled>Select customer</option>
                @for (customer of customers.data()?.results ?? []; track customer.id) {
                  <option [value]="customer.id">{{ customer.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="site-name">Name</label>
              <input appInput id="site-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="site-lat">Latitude</label>
                <input appInput id="site-lat" [(ngModel)]="form.latitude" name="latitude" />
              </div>
              <div class="space-y-2">
                <label appLabel for="site-lng">Longitude</label>
                <input appInput id="site-lng" [(ngModel)]="form.longitude" name="longitude" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="site-address">Address</label>
              <textarea appTextarea id="site-address" rows="2" [(ngModel)]="form.address" name="address"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="site-contact">Contact name</label>
                <input appInput id="site-contact" [(ngModel)]="form.contact_name" name="contact_name" />
              </div>
              <div class="space-y-2">
                <label appLabel for="site-phone">Contact phone</label>
                <input appInput id="site-phone" [(ngModel)]="form.contact_phone" name="contact_phone" />
              </div>
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

      @if (editSite(); as site) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ site.name }}</div>
          <div appDialogDesc>Update site information.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="edit-site-customer">Customer</label>
              <select appSelect id="edit-site-customer" [(ngModel)]="form.customer" name="customer">
                @for (customer of customers.data()?.results ?? []; track customer.id) {
                  <option [value]="customer.id">{{ customer.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-site-name">Name</label>
              <input appInput id="edit-site-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-site-lat">Latitude</label>
                <input appInput id="edit-site-lat" [(ngModel)]="form.latitude" name="latitude" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-site-lng">Longitude</label>
                <input appInput id="edit-site-lng" [(ngModel)]="form.longitude" name="longitude" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-site-address">Address</label>
              <textarea appTextarea id="edit-site-address" rows="2" [(ngModel)]="form.address" name="address"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-site-contact">Contact name</label>
                <input appInput id="edit-site-contact" [(ngModel)]="form.contact_name" name="contact_name" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-site-phone">Contact phone</label>
                <input appInput id="edit-site-phone" [(ngModel)]="form.contact_phone" name="contact_phone" />
              </div>
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

      @if (detailsSite(); as site) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ site.name }}</div>
          <div appSheetDesc>{{ site.customer_name }}</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Address</dt>
              <dd class="font-medium">{{ site.address || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Coordinates</dt>
              <dd class="font-medium">{{ coords(site) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Contact</dt>
              <dd class="font-medium">{{ site.contact_name || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Phone</dt>
              <dd class="font-medium">{{ site.contact_phone || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Assets</dt>
              <dd class="font-medium">{{ site.asset_count }}</dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class SitesComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected createOpen = signal(false);
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editSite = signal<Site | null>(null);
  protected detailsSite = signal<Site | null>(null);
  protected form: SiteForm = emptyForm();

  protected list = pagedList<Site>({
    url: '/sites/',
    queryKey: ['sites'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected customers = injectQuery(() => ({
    queryKey: ['customers'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Customer>>('/customers/')),
  }));

  protected createMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.api.post('/sites/', {
          customer: Number(this.form.customer),
          name: this.form.name,
          address: this.form.address,
          latitude: this.form.latitude ? Number(this.form.latitude) : null,
          longitude: this.form.longitude ? Number(this.form.longitude) : null,
          contact_name: this.form.contact_name,
          contact_phone: this.form.contact_phone,
        }),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.toast.success('Site created');
      this.closeCreate();
      this.form = emptyForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const site = this.editSite()!;
      return lastValueFrom(
        this.api.patch(`/sites/${site.id}/`, {
          customer: Number(this.form.customer),
          name: this.form.name,
          address: this.form.address,
          latitude: this.form.latitude ? Number(this.form.latitude) : null,
          longitude: this.form.longitude ? Number(this.form.longitude) : null,
          contact_name: this.form.contact_name,
          contact_phone: this.form.contact_phone,
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.toast.success('Site updated');
      this.closeEdit();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  coords(site: Site): string {
    return site.latitude != null && site.longitude != null
      ? `${site.latitude}, ${site.longitude}`
      : '—';
  }

  openCreate(): void {
    this.form = emptyForm();
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  openEdit(site: Site): void {
    this.editSite.set(site);
    this.form = fromSite(site);
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(site: Site): void {
    this.detailsSite.set(site);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  create(): void {
    if (!this.form.customer || !this.form.name) return;
    this.createMutation.mutate();
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

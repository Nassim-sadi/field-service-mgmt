import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQuery, injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Asset, AssetStatus, Paginated, Site } from '../../core/api/types';
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
  ViewActionComponent,
} from '../../shared/ui';
import { AssetStatusBadgeComponent } from '../../shared/status-badge';
import { ToastService } from '../../core/toast.service';

export const assetStatuses: { value: AssetStatus; label: string }[] = [
  { value: 'operational', label: 'Operational' },
  { value: 'under_maintenance', label: 'Under maintenance' },
  { value: 'out_of_service', label: 'Out of service' },
];

interface AssetForm {
  site: string;
  name: string;
  asset_type: string;
  serial_number: string;
  status: AssetStatus;
}

const emptyForm = (): AssetForm => ({
  site: '',
  name: '',
  asset_type: '',
  serial_number: '',
  status: 'operational',
});

const fromAsset = (a: Asset): AssetForm => ({
  site: String(a.site),
  name: a.name,
  asset_type: a.asset_type,
  serial_number: a.serial_number,
  status: a.status,
});

@Component({
  selector: 'app-assets',
  imports: [
    FormsModule,
    NgIcon,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    SelectDirective,
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
    AssetStatusBadgeComponent,
    DialogComponent,
    SheetComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Assets" description="Manage equipment and devices">
        <button appButton (click)="openCreate()">
          <ng-icon name="plus" size="16" /> Add asset
        </button>
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search assets…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Name</th>
                <th appTableHead>Type</th>
                <th appTableHead>Serial number</th>
                <th appTableHead>Site</th>
                <th appTableHead>Status</th>
                <th appTableHead class="w-32"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (asset of list.data()?.results ?? []; track asset.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-medium">{{ asset.name }}</td>
                    <td appTableCell>{{ asset.asset_type || '—' }}</td>
                    <td appTableCell>{{ asset.serial_number || '—' }}</td>
                    <td appTableCell>{{ asset.site_name }}</td>
                    <td appTableCell><span appAssetStatusBadge [status]="asset.status"></span></td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(asset)"></button>
                        <button appEditAction (clicked)="openEdit(asset)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">No assets found.</td>
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
          <div appDialogTitle>New asset</div>
          <div appDialogDesc>Add a piece of equipment.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="asset-site">Site</label>
              <select appSelect id="asset-site" [(ngModel)]="form.site" name="site">
                <option value="" disabled>Select site</option>
                @for (site of sites.data()?.results ?? []; track site.id) {
                  <option [value]="site.id">{{ site.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="asset-name">Name</label>
              <input appInput id="asset-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="asset-type">Type</label>
                <input appInput id="asset-type" [(ngModel)]="form.asset_type" name="asset_type" />
              </div>
              <div class="space-y-2">
                <label appLabel for="asset-serial">Serial number</label>
                <input appInput id="asset-serial" [(ngModel)]="form.serial_number" name="serial_number" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="asset-status">Status</label>
              <select appSelect id="asset-status" [(ngModel)]="form.status" name="status">
                @for (option of statuses; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
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

      @if (editAsset(); as asset) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ asset.name }}</div>
          <div appDialogDesc>Update asset information.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="edit-asset-site">Site</label>
              <select appSelect id="edit-asset-site" [(ngModel)]="form.site" name="site">
                @for (site of sites.data()?.results ?? []; track site.id) {
                  <option [value]="site.id">{{ site.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-asset-name">Name</label>
              <input appInput id="edit-asset-name" required [(ngModel)]="form.name" name="name" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-asset-type">Type</label>
                <input appInput id="edit-asset-type" [(ngModel)]="form.asset_type" name="asset_type" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-asset-serial">Serial number</label>
                <input appInput id="edit-asset-serial" [(ngModel)]="form.serial_number" name="serial_number" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-asset-status">Status</label>
              <select appSelect id="edit-asset-status" [(ngModel)]="form.status" name="status">
                @for (option of statuses; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
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

      @if (detailsAsset(); as asset) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ asset.name }}</div>
          <div appSheetDesc>{{ asset.site_name }}</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Type</dt>
              <dd class="font-medium">{{ asset.asset_type || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Serial number</dt>
              <dd class="font-medium">{{ asset.serial_number || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Status</dt>
              <dd class="font-medium"><span appAssetStatusBadge [status]="asset.status"></span></dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class AssetsComponent {
  protected readonly statuses = assetStatuses;

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected createOpen = signal(false);
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editAsset = signal<Asset | null>(null);
  protected detailsAsset = signal<Asset | null>(null);
  protected form: AssetForm = emptyForm();

  protected list = pagedList<Asset>({
    url: '/assets/',
    queryKey: ['assets'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected sites = injectQuery(() => ({
    queryKey: ['sites'],
    queryFn: () => lastValueFrom(this.api.get<Paginated<Site>>('/sites/')),
  }));

  protected createMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.api.post('/assets/', {
          site: Number(this.form.site),
          name: this.form.name,
          asset_type: this.form.asset_type,
          serial_number: this.form.serial_number,
          status: this.form.status,
        }),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['assets'] });
      this.toast.success('Asset created');
      this.closeCreate();
      this.form = emptyForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const asset = this.editAsset()!;
      return lastValueFrom(
        this.api.patch(`/assets/${asset.id}/`, {
          site: Number(this.form.site),
          name: this.form.name,
          asset_type: this.form.asset_type,
          serial_number: this.form.serial_number,
          status: this.form.status,
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['assets'] });
      this.toast.success('Asset updated');
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

  openEdit(asset: Asset): void {
    this.editAsset.set(asset);
    this.form = fromAsset(asset);
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(asset: Asset): void {
    this.detailsAsset.set(asset);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  create(): void {
    if (!this.form.site || !this.form.name) return;
    this.createMutation.mutate();
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

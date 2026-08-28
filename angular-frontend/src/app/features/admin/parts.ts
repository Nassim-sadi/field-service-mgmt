import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Part } from '../../core/api/types';
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

interface PartForm {
  sku: string;
  name: string;
  description: string;
  stock_qty: string;
  unit_price: string;
}

const emptyForm = (): PartForm => ({ sku: '', name: '', description: '', stock_qty: '0', unit_price: '0' });

const fromPart = (p: Part): PartForm => ({
  sku: p.sku,
  name: p.name,
  description: p.description,
  stock_qty: String(p.stock_qty),
  unit_price: p.unit_price,
});

@Component({
  selector: 'app-parts',
  imports: [
    FormsModule,
    NgIcon,
    DatePipe,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
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
      <app-page-header title="Parts" description="Inventory and spare parts">
        <button appButton (click)="openCreate()">
          <ng-icon name="plus" size="16" /> Add part
        </button>
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search parts…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>SKU</th>
                <th appTableHead>Name</th>
                <th appTableHead>Stock</th>
                <th appTableHead>Unit price</th>
                <th appTableHead class="w-32"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="5" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (part of list.data()?.results ?? []; track part.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-mono text-xs">{{ part.sku }}</td>
                    <td appTableCell class="font-medium">{{ part.name }}</td>
                    <td appTableCell>{{ part.stock_qty }}</td>
                    <td appTableCell>{{ '$' + part.unit_price }}</td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(part)"></button>
                        <button appEditAction (clicked)="openEdit(part)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="5" class="h-24 text-center text-muted-foreground">No parts found.</td>
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
          <div appDialogTitle>New part</div>
          <div appDialogDesc>Add an inventory item.</div>
          <div appDialogContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="part-sku">SKU</label>
                <input appInput id="part-sku" required [(ngModel)]="form.sku" name="sku" />
              </div>
              <div class="space-y-2">
                <label appLabel for="part-name">Name</label>
                <input appInput id="part-name" required [(ngModel)]="form.name" name="name" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="part-stock">Stock quantity</label>
                <input appInput id="part-stock" type="number" [(ngModel)]="form.stock_qty" name="stock_qty" />
              </div>
              <div class="space-y-2">
                <label appLabel for="part-price">Unit price</label>
                <input appInput id="part-price" type="number" step="0.01" [(ngModel)]="form.unit_price" name="unit_price" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="part-desc">Description</label>
              <textarea appTextarea id="part-desc" rows="3" [(ngModel)]="form.description" name="description"></textarea>
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

      @if (editPart(); as part) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ part.name }}</div>
          <div appDialogDesc>Update inventory item.</div>
          <div appDialogContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-part-sku">SKU</label>
                <input appInput id="edit-part-sku" required [(ngModel)]="form.sku" name="sku" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-part-name">Name</label>
                <input appInput id="edit-part-name" required [(ngModel)]="form.name" name="name" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-part-stock">Stock quantity</label>
                <input appInput id="edit-part-stock" type="number" [(ngModel)]="form.stock_qty" name="stock_qty" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-part-price">Unit price</label>
                <input appInput id="edit-part-price" type="number" step="0.01" [(ngModel)]="form.unit_price" name="unit_price" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-part-desc">Description</label>
              <textarea appTextarea id="edit-part-desc" rows="3" [(ngModel)]="form.description" name="description"></textarea>
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

      @if (detailsPart(); as part) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ part.name }}</div>
          <div appSheetDesc>{{ part.sku }}</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Description</dt>
              <dd class="font-medium">{{ part.description || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Stock</dt>
              <dd class="font-medium">{{ part.stock_qty }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Unit price</dt>
              <dd class="font-medium">{{ '$' + part.unit_price }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Created</dt>
              <dd class="font-medium">{{ part.created_at | date }}</dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class PartsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected createOpen = signal(false);
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editPart = signal<Part | null>(null);
  protected detailsPart = signal<Part | null>(null);
  protected form: PartForm = emptyForm();

  protected list = pagedList<Part>({
    url: '/parts/',
    queryKey: ['parts'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected createMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.api.post('/parts/', {
          sku: this.form.sku,
          name: this.form.name,
          description: this.form.description,
          stock_qty: Number(this.form.stock_qty),
          unit_price: Number(this.form.unit_price),
        }),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['parts'] });
      this.toast.success('Part created');
      this.closeCreate();
      this.form = emptyForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const part = this.editPart()!;
      return lastValueFrom(
        this.api.patch(`/parts/${part.id}/`, {
          sku: this.form.sku,
          name: this.form.name,
          description: this.form.description,
          stock_qty: Number(this.form.stock_qty),
          unit_price: Number(this.form.unit_price),
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['parts'] });
      this.toast.success('Part updated');
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

  openEdit(part: Part): void {
    this.editPart.set(part);
    this.form = fromPart(part);
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(part: Part): void {
    this.detailsPart.set(part);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  create(): void {
    if (!this.form.sku || !this.form.name) return;
    this.createMutation.mutate();
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Technician } from '../../core/api/types';
import {
  BadgeComponent,
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
  ViewActionComponent,
} from '../../shared/ui';
import { ToastService } from '../../core/toast.service';

interface TechnicianForm {
  specialty: string;
  hourly_rate: string;
  is_active: boolean;
  latitude: string;
  longitude: string;
}

const fromTechnician = (t: Technician): TechnicianForm => ({
  specialty: t.specialty,
  hourly_rate: t.hourly_rate,
  is_active: t.is_active,
  latitude: t.latitude != null ? String(t.latitude) : '',
  longitude: t.longitude != null ? String(t.longitude) : '',
});

@Component({
  selector: 'app-technicians',
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    BadgeComponent,
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
      <app-page-header title="Technicians" description="Field staff and their assignments"></app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search technicians…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Name</th>
                <th appTableHead>Username</th>
                <th appTableHead>Specialty</th>
                <th appTableHead>Rate</th>
                <th appTableHead>Open orders</th>
                <th appTableHead>Status</th>
                <th appTableHead class="w-32"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="7" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (technician of list.data()?.results ?? []; track technician.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-medium">{{ technician.full_name || technician.username }}</td>
                    <td appTableCell>{{ technician.username }}</td>
                    <td appTableCell>{{ technician.specialty || '—' }}</td>
                    <td appTableCell>{{ '$' + technician.hourly_rate }}</td>
                    <td appTableCell>{{ technician.open_work_orders }}</td>
                    <td appTableCell>
                      <span appBadge variant="secondary">{{ technician.is_active ? 'Active' : 'Inactive' }}</span>
                    </td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(technician)"></button>
                        <button appEditAction (clicked)="openEdit(technician)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="7" class="h-24 text-center text-muted-foreground">No technicians found.</td>
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

      @if (editTechnician(); as technician) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ technician.full_name || technician.username }}</div>
          <div appDialogDesc>Update technician details.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="edit-tech-specialty">Specialty</label>
              <input appInput id="edit-tech-specialty" [(ngModel)]="form.specialty" name="specialty" />
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-tech-rate">Hourly rate</label>
              <input appInput id="edit-tech-rate" type="number" step="0.01" [(ngModel)]="form.hourly_rate" name="hourly_rate" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="edit-tech-lat">Latitude</label>
                <input appInput id="edit-tech-lat" [(ngModel)]="form.latitude" name="latitude" />
              </div>
              <div class="space-y-2">
                <label appLabel for="edit-tech-lng">Longitude</label>
                <input appInput id="edit-tech-lng" [(ngModel)]="form.longitude" name="longitude" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input id="edit-tech-active" type="checkbox" [(ngModel)]="form.is_active" name="is_active" class="size-4" />
              <label appLabel for="edit-tech-active">Active</label>
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

      @if (detailsTechnician(); as technician) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ technician.full_name || technician.username }}</div>
          <div appSheetDesc>{{ technician.username }}</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Specialty</dt>
              <dd class="font-medium">{{ technician.specialty || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Hourly rate</dt>
              <dd class="font-medium">{{ '$' + technician.hourly_rate }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Open work orders</dt>
              <dd class="font-medium">{{ technician.open_work_orders }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Coordinates</dt>
              <dd class="font-medium">{{ coords(technician) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Status</dt>
              <dd class="font-medium">
                <span appBadge variant="secondary">{{ technician.is_active ? 'Active' : 'Inactive' }}</span>
              </dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class TechniciansComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editTechnician = signal<Technician | null>(null);
  protected detailsTechnician = signal<Technician | null>(null);
  protected form: TechnicianForm = {
    specialty: '',
    hourly_rate: '',
    is_active: true,
    latitude: '',
    longitude: '',
  };

  protected list = pagedList<Technician>({
    url: '/technicians/',
    queryKey: ['technicians'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const technician = this.editTechnician()!;
      return lastValueFrom(
        this.api.patch(`/technicians/${technician.id}/`, {
          specialty: this.form.specialty,
          hourly_rate: this.form.hourly_rate,
          is_active: this.form.is_active,
          latitude: this.form.latitude ? Number(this.form.latitude) : null,
          longitude: this.form.longitude ? Number(this.form.longitude) : null,
        }),
      );
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
      this.toast.success('Technician updated');
      this.closeEdit();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  coords(t: Technician): string {
    return t.latitude != null && t.longitude != null ? `${t.latitude}, ${t.longitude}` : '—';
  }

  openEdit(technician: Technician): void {
    this.editTechnician.set(technician);
    this.form = fromTechnician(technician);
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(technician: Technician): void {
    this.detailsTechnician.set(technician);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

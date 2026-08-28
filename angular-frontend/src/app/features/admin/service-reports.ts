import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { ServiceReport } from '../../core/api/types';
import {
  BadgeComponent,
  CardComponent,
  CardContentComponent,
  InputDirective,
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

@Component({
  selector: 'app-service-reports',
  imports: [
    FormsModule,
    PageHeaderComponent,
    InputDirective,
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
    SheetComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Service Reports" description="Completed work order reports"></app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search service reports…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Work order</th>
                <th appTableHead>Diagnosis</th>
                <th appTableHead>Labor hours</th>
                <th appTableHead>Confirmed</th>
                <th appTableHead class="w-24"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="5" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (report of list.data()?.results ?? []; track report.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-mono text-xs">{{ report.work_order_number }}</td>
                    <td appTableCell class="max-w-md truncate">{{ report.diagnosis || '—' }}</td>
                    <td appTableCell>{{ report.labor_hours }} hrs</td>
                    <td appTableCell>{{ report.customer_confirmation ? 'Yes' : 'No' }}</td>
                    <td appTableCell>
                      <button appViewAction (clicked)="openDetails(report)"></button>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="5" class="h-24 text-center text-muted-foreground">No service reports yet.</td>
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

      @if (detailsReport(); as report) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>Service report · {{ report.work_order_number }}</div>
          <div appSheetDesc>
            <span appBadge variant="secondary">{{ report.customer_confirmation ? 'Customer confirmed' : 'Not confirmed' }}</span>
          </div>
          <div appSheetContent class="space-y-4 text-sm">
            <dl class="space-y-3">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Labor hours</dt>
                <dd class="text-right font-medium">{{ report.labor_hours }} hrs</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Signature</dt>
                <dd class="text-right font-medium">{{ report.signature || '—' }}</dd>
              </div>
            </dl>
            <div class="space-y-1">
              <div class="font-medium">Diagnosis</div>
              <p class="whitespace-pre-wrap text-muted-foreground">{{ report.diagnosis || '—' }}</p>
            </div>
            <div class="space-y-1">
              <div class="font-medium">Resolution</div>
              <p class="whitespace-pre-wrap text-muted-foreground">{{ report.resolution || '—' }}</p>
            </div>
          </div>
        </app-sheet>
      }
    </div>
  `,
})
export class ServiceReportsComponent {
  private api = inject(ApiService);

  protected search = signal('');
  protected detailsOpen = signal(false);
  protected detailsReport = signal<ServiceReport | null>(null);

  protected list = pagedList<ServiceReport>({
    url: '/service-reports/',
    queryKey: ['serviceReports'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  openDetails(report: ServiceReport): void {
    this.detailsReport.set(report);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }
}

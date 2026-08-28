import { Component, Input, Output, EventEmitter } from '@angular/core';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

@Component({
  selector: 'app-paginated-footer',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{{ from }}–{{ to }} of {{ count }}</span>
        <select
          class="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm"
          [value]="pageSize"
          (change)="onPageSize($event)"
          aria-label="Rows per page"
        >
          @for (size of pageSizeOptions; track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
      </div>
      <nav class="flex items-center gap-1">
        <button
          class="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          [disabled]="page <= 1"
          (click)="goTo(page - 1)"
        >
          Previous
        </button>
        @for (p of pages(); track p) {
          @if (p === 'ellipsis') {
            <span class="px-2 text-muted-foreground">…</span>
          } @else {
            <button
              class="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm hover:bg-accent"
              [class.bg-accent]="p === page"
              (click)="goTo(p)"
            >
              {{ p }}
            </button>
          }
        }
        <button
          class="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          [disabled]="page >= totalPages"
          (click)="goTo(page + 1)"
        >
          Next
        </button>
      </nav>
    </div>
  `,
})
export class PaginatedFooterComponent {
  @Input() count = 0;
  @Input() page = 1;
  @Input() pageSize = 25;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.count / this.pageSize));
  }
  get from(): number {
    return this.count === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }
  get to(): number {
    return Math.min(this.count, this.page * this.pageSize);
  }

  pages(): (number | 'ellipsis')[] {
    const current = this.page;
    const total = this.totalPages;
    const result: (number | 'ellipsis')[] = [];
    for (let page = 1; page <= total; page++) {
      if (page === 1 || page === total || Math.abs(page - current) <= 1) {
        result.push(page);
      } else if (result[result.length - 1] !== 'ellipsis') {
        result.push('ellipsis');
      }
    }
    return result;
  }

  goTo(page: number): void {
    this.pageChange.emit(page);
  }

  onPageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value) this.pageSizeChange.emit(value);
  }
}

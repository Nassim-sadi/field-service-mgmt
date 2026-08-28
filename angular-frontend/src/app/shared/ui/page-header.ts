import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
        @if (description) {
          <p class="text-sm text-muted-foreground">{{ description }}</p>
        }
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() description = '';
}

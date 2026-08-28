import { Component, Input, computed } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="animate-pulse rounded-md bg-muted" [style]="{ width: width, height: height }"></div>`,
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
}

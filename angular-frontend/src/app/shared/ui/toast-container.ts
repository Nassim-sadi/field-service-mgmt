import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      @for (toast of service.toasts(); track toast.id) {
        <div
          class="flex w-full max-w-sm items-center justify-between gap-3 rounded-md border bg-background px-4 py-3 text-sm shadow-lg"
        >
          <span [class.text-destructive]="toast.type === 'error'">{{ toast.message }}</span>
          <button class="text-muted-foreground hover:text-foreground" (click)="service.dismiss(toast.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  constructor(readonly service: ToastService) {}
}

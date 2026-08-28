import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="close.emit()"></div>
        <div
          role="dialog"
          aria-modal="true"
          class="relative z-10 w-full max-w-lg rounded-lg border bg-background shadow-lg"
        >
          <div class="flex flex-col space-y-1.5 p-6">
            <h2 class="text-lg font-semibold"><ng-content select="[appDialogTitle]"></ng-content></h2>
            <p class="text-sm text-muted-foreground"><ng-content select="[appDialogDesc]"></ng-content></p>
          </div>
          <div class="p-6 pt-0"><ng-content select="[appDialogContent]"></ng-content></div>
          @if (footer) {
            <div class="flex items-center p-6 pt-0"><ng-content select="[appDialogFooter]"></ng-content></div>
          }
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  @Input() open = false;
  @Input() footer = true;
  @Output() close = new EventEmitter<void>();
}

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sheet',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50" (click)="close.emit()"></div>
        <div
          role="dialog"
          aria-modal="true"
          class="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l bg-background shadow-lg"
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div class="space-y-0.5">
              <h2 class="text-lg font-semibold"><ng-content select="[appSheetTitle]"></ng-content></h2>
              <p class="text-sm text-muted-foreground"><ng-content select="[appSheetDesc]"></ng-content></p>
            </div>
            <button class="rounded-md p-1 hover:bg-accent" (click)="close.emit()">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto p-6"><ng-content select="[appSheetContent]"></ng-content></div>
        </div>
      </div>
    }
  `,
})
export class SheetComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
}

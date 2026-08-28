import { Component, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'button[appViewAction]',
  standalone: true,
  imports: [NgIcon],
  template: `<ng-icon name="eye" size="16" /><span class="sr-only">Details</span>`,
  host: {
    class: 'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    '(click)': 'clicked.emit()',
  },
})
export class ViewActionComponent {
  @Output() clicked = new EventEmitter<void>();
}

@Component({
  selector: 'button[appEditAction]',
  standalone: true,
  imports: [NgIcon],
  template: `<ng-icon name="pencil" size="16" /><span class="sr-only">Edit</span>`,
  host: {
    class: 'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    '(click)': 'clicked.emit()',
  },
})
export class EditActionComponent {
  @Output() clicked = new EventEmitter<void>();
}

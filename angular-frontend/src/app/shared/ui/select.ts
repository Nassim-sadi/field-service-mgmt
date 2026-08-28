import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'select[appSelect]' })
export class SelectDirective {
  @HostBinding('class') hostClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
}

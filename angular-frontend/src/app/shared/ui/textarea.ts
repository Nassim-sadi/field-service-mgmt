import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'textarea[appTextarea]' })
export class TextareaDirective {
  @HostBinding('class') hostClass =
    'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
}

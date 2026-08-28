import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'label[appLabel]' })
export class LabelDirective {
  @HostBinding('class') hostClass =
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
}

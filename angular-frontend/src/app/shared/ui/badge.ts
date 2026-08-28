import { Component, HostBinding, Input } from '@angular/core';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-white',
  outline: 'text-foreground',
};

const base =
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

@Component({
  selector: 'span[appBadge]',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class BadgeComponent {
  @HostBinding('class') get hostClass(): string {
    return `${base} ${variants[this.variant]}`;
  }

  @Input() variant: BadgeVariant = 'default';
}

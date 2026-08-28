import { Component, HostBinding, Input } from '@angular/core';
import { AssetStatus, Role, WorkOrderPriority, WorkOrderStatus } from '../core/api/types';

const roleStyles: Record<Role, string> = {
  admin: 'border-transparent bg-primary text-primary-foreground',
  manager: 'border-transparent bg-secondary text-secondary-foreground',
  technician: 'border-transparent bg-yellow-400 text-yellow-950',
  customer: 'border-transparent bg-muted text-muted-foreground',
};

const statusStyles: Record<WorkOrderStatus, string> = {
  new: 'border-blue-200 bg-blue-50 text-blue-700',
  assigned: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  accepted: 'border-purple-200 bg-purple-50 text-purple-700',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-gray-200 bg-gray-100 text-gray-600',
};

const priorityStyles: Record<WorkOrderPriority, string> = {
  low: 'border-gray-200 bg-gray-100 text-gray-600',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  urgent: 'border-red-200 bg-red-50 text-red-700',
};

const assetStyles: Record<AssetStatus, string> = {
  operational: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  under_maintenance: 'border-amber-200 bg-amber-50 text-amber-700',
  out_of_service: 'border-red-200 bg-red-50 text-red-700',
};

const base = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold';

const label: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  technician: 'Technician',
  customer: 'Customer',
};

@Component({
  selector: 'span[appRoleBadge]',
  standalone: true,
  template: '{{ label }}',
})
export class RoleBadgeComponent {
  @HostBinding('class') get hostClass(): string {
    return `${base} ${roleStyles[this.role]}`;
  }
  @Input() role: Role = 'customer';
  get label(): string {
    return label[this.role];
  }
}

@Component({
  selector: 'span[appStatusBadge]',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class StatusBadgeComponent {
  @HostBinding('class') get hostClass(): string {
    return `${base} ${statusStyles[this.status]}`;
  }
  @Input() status: WorkOrderStatus = 'new';
}

@Component({
  selector: 'span[appPriorityBadge]',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class PriorityBadgeComponent {
  @HostBinding('class') get hostClass(): string {
    return `${base} ${priorityStyles[this.priority]}`;
  }
  @Input() priority: WorkOrderPriority = 'medium';
}

@Component({
  selector: 'span[appAssetStatusBadge]',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class AssetStatusBadgeComponent {
  @HostBinding('class') get hostClass(): string {
    return `${base} ${assetStyles[this.status]}`;
  }
  @Input() status: AssetStatus = 'operational';
}

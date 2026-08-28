import { Component } from '@angular/core';

@Component({
  selector: 'table[appTable]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: { class: 'w-full caption-bottom text-sm' },
})
export class TableComponent {}

@Component({
  selector: 'thead[appTableHeader]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: { class: '[&_tr]:border-b' },
})
export class TableHeaderComponent {}

@Component({
  selector: 'tbody[appTableBody]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: { class: '[&_tr:last-child]:border-0' },
})
export class TableBodyComponent {}

@Component({
  selector: 'tr[appTableRow]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: { class: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted' },
})
export class TableRowComponent {}

@Component({
  selector: 'th[appTableHead]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: {
    class: 'h-10 px-2 text-left align-middle font-medium text-muted-foreground',
  },
})
export class TableHeadComponent {}

@Component({
  selector: 'td[appTableCell]',
  standalone: true,
  template: `<ng-content></ng-content>`,
  host: { class: 'p-2 align-middle' },
})
export class TableCellComponent {}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { pagedList } from '../../core/paged-list';
import { Role, User } from '../../core/api/types';
import {
  ButtonDirective,
  CardComponent,
  CardContentComponent,
  DialogComponent,
  EditActionComponent,
  InputDirective,
  LabelDirective,
  PageHeaderComponent,
  PaginatedFooterComponent,
  SelectDirective,
  SheetComponent,
  TableBodyComponent,
  TableCellComponent,
  TableComponent,
  TableHeadComponent,
  TableHeaderComponent,
  TableRowComponent,
  ViewActionComponent,
} from '../../shared/ui';
import { RoleBadgeComponent } from '../../shared/status-badge';
import { ToastService } from '../../core/toast.service';

const roles: Role[] = ['customer', 'technician', 'manager', 'admin'];

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Role;
}

const emptyUserForm = (): CreateUserForm => ({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'customer',
});

interface EditUserForm {
  role: Role;
  is_active: boolean;
}

@Component({
  selector: 'app-users',
  imports: [
    FormsModule,
    NgIcon,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    SelectDirective,
    CardComponent,
    CardContentComponent,
    TableComponent,
    TableHeaderComponent,
    TableBodyComponent,
    TableRowComponent,
    TableHeadComponent,
    TableCellComponent,
    PaginatedFooterComponent,
    ViewActionComponent,
    EditActionComponent,
    RoleBadgeComponent,
    DialogComponent,
    SheetComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Users" description="Manage user accounts and roles">
        <button appButton (click)="openCreate()">
          <ng-icon name="plus" size="16" /> Add user
        </button>
      </app-page-header>

      <app-card>
        <app-card-content class="pt-6">
          <div class="mb-4 max-w-sm">
            <input appInput placeholder="Search users…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <table appTable>
            <thead appTableHeader>
              <tr appTableRow>
                <th appTableHead>Username</th>
                <th appTableHead>Name</th>
                <th appTableHead>Email</th>
                <th appTableHead>Role</th>
                <th appTableHead>Status</th>
                <th appTableHead class="w-16"></th>
              </tr>
            </thead>
            <tbody appTableBody>
              @if (list.isLoading()) {
                <tr appTableRow>
                  <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">Loading…</td>
                </tr>
              } @else {
                @for (user of list.data()?.results ?? []; track user.id) {
                  <tr appTableRow>
                    <td appTableCell class="font-medium">{{ user.username }}</td>
                    <td appTableCell>{{ fullName(user) }}</td>
                    <td appTableCell>{{ user.email || '—' }}</td>
                    <td appTableCell><span appRoleBadge [role]="user.role"></span></td>
                    <td appTableCell>{{ user.is_active ? 'Active' : 'Inactive' }}</td>
                    <td appTableCell>
                      <div class="flex items-center gap-1">
                        <button appViewAction (clicked)="openDetails(user)"></button>
                        <button appEditAction (clicked)="openEdit(user)"></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr appTableRow>
                    <td appTableCell colspan="6" class="h-24 text-center text-muted-foreground">No users found.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
          <app-paginated-footer
            [count]="list.data()?.count ?? 0"
            [page]="list.page()"
            [pageSize]="list.pageSize()"
            (pageChange)="list.setPage($event)"
            (pageSizeChange)="list.setPageSize($event)"
          ></app-paginated-footer>
        </app-card-content>
      </app-card>

      @if (createOpen()) {
        <app-dialog [open]="createOpen()" (close)="closeCreate()">
          <div appDialogTitle>New user</div>
          <div appDialogDesc>Create a user account with a role.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="username">Username</label>
              <input appInput id="username" required [(ngModel)]="createForm.username" name="username" />
            </div>
            <div class="space-y-2">
              <label appLabel for="email">Email</label>
              <input appInput id="email" type="email" [(ngModel)]="createForm.email" name="email" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label appLabel for="first_name">First name</label>
                <input appInput id="first_name" [(ngModel)]="createForm.first_name" name="first_name" />
              </div>
              <div class="space-y-2">
                <label appLabel for="last_name">Last name</label>
                <input appInput id="last_name" [(ngModel)]="createForm.last_name" name="last_name" />
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="password">Password</label>
              <input appInput id="password" type="password" required [(ngModel)]="createForm.password" name="password" />
            </div>
            <div class="space-y-2">
              <label appLabel for="role">Role</label>
              <select appSelect id="role" [(ngModel)]="createForm.role" name="role">
                @for (role of roles; track role) {
                  <option [value]="role">{{ roleLabel(role) }}</option>
                }
              </select>
            </div>
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="closeCreate()">Cancel</button>
            <button appButton [disabled]="createMutation.isPending()" (click)="create()">
              {{ createMutation.isPending() ? 'Saving…' : 'Create user' }}
            </button>
          </div>
        </app-dialog>
      }

      @if (editUser(); as user) {
        <app-dialog [open]="editOpen()" (close)="closeEdit()">
          <div appDialogTitle>Edit {{ user.username }}</div>
          <div appDialogDesc>Update role and account status.</div>
          <div appDialogContent class="space-y-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Username</span>
                <span class="font-medium">{{ user.username }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Email</span>
                <span class="font-medium">{{ user.email || '—' }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <label appLabel for="edit-user-role">Role</label>
              <select appSelect id="edit-user-role" [(ngModel)]="editForm.role" name="role">
                @for (role of roles; track role) {
                  <option [value]="role">{{ roleLabel(role) }}</option>
                }
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input id="edit-user-active" type="checkbox" [(ngModel)]="editForm.is_active" name="is_active" class="size-4" />
              <label appLabel for="edit-user-active">Active</label>
            </div>
          </div>
          <div appDialogFooter class="justify-end gap-2">
            <button appButton variant="outline" type="button" (click)="closeEdit()">Cancel</button>
            <button appButton [disabled]="editMutation.isPending()" (click)="saveEdit()">
              {{ editMutation.isPending() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </app-dialog>
      }

      @if (detailsUser(); as user) {
        <app-sheet [open]="detailsOpen()" (close)="closeDetails()">
          <div appSheetTitle>{{ user.username }}</div>
          <div appSheetDesc>User details</div>
          <dl appSheetContent class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Name</dt>
              <dd class="font-medium">{{ fullName(user) || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Email</dt>
              <dd class="font-medium">{{ user.email || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Role</dt>
              <dd class="font-medium"><span appRoleBadge [role]="user.role"></span></dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Status</dt>
              <dd class="font-medium">{{ user.is_active ? 'Active' : 'Inactive' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Staff</dt>
              <dd class="font-medium">{{ user.is_staff ? 'Yes' : 'No' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">ID</dt>
              <dd class="font-medium">{{ user.id }}</dd>
            </div>
          </dl>
        </app-sheet>
      }
    </div>
  `,
})
export class UsersComponent {
  protected readonly roles = roles;

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  protected search = signal('');
  protected createOpen = signal(false);
  protected editOpen = signal(false);
  protected detailsOpen = signal(false);
  protected editUser = signal<User | null>(null);
  protected detailsUser = signal<User | null>(null);
  protected createForm: CreateUserForm = emptyUserForm();
  protected editForm: EditUserForm = { role: 'customer', is_active: true };

  protected list = pagedList<User>({
    url: '/users/',
    queryKey: ['users'],
    search: this.search,
    page: signal(1),
    pageSize: signal(25),
  });

  protected createMutation = injectMutation(() => ({
    mutationFn: () => lastValueFrom(this.api.post('/users/', this.createForm)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
      this.toast.success('User created');
      this.closeCreate();
      this.createForm = emptyUserForm();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  protected editMutation = injectMutation(() => ({
    mutationFn: () => {
      const user = this.editUser()!;
      return lastValueFrom(this.api.patch(`/users/${user.id}/`, this.editForm));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
      this.toast.success('User updated');
      this.closeEdit();
    },
    onError: (error) => this.toast.error(apiErrorMessage(error)),
  }));

  fullName(user: User): string {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }

  roleLabel(role: Role): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  openCreate(): void {
    this.createForm = emptyUserForm();
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  openEdit(user: User): void {
    this.editUser.set(user);
    this.editForm = { role: user.role, is_active: user.is_active };
    this.editOpen.set(true);
  }
  closeEdit(): void {
    this.editOpen.set(false);
  }

  openDetails(user: User): void {
    this.detailsUser.set(user);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }

  create(): void {
    if (!this.createForm.username || !this.createForm.password) return;
    this.createMutation.mutate();
  }

  saveEdit(): void {
    this.editMutation.mutate();
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ApiService, apiErrorMessage } from '../../core/api/api.service';
import { tokenStore } from '../../core/api/token-store';
import { AuthService } from '../../core/auth/auth.service';
import {
  ButtonDirective,
  CardComponent,
  CardContentComponent,
  CardDescriptionComponent,
  CardHeaderComponent,
  CardTitleComponent,
  InputDirective,
  LabelDirective,
  PageHeaderComponent,
} from '../../shared/ui';
import { RoleBadgeComponent } from '../../shared/status-badge';
import { ToastService } from '../../core/toast.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-account',
  imports: [
    FormsModule,
    NgIcon,
    PageHeaderComponent,
    ButtonDirective,
    InputDirective,
    LabelDirective,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    RoleBadgeComponent,
  ],
  template: `
    <div class="space-y-4">
      <app-page-header title="Account Settings" description="Manage your profile, password, and API access"></app-page-header>

      <div class="grid gap-4 lg:grid-cols-2">
        <app-card>
          <app-card-header>
            <app-card-title>Profile</app-card-title>
            <app-card-description>Your account information.</app-card-description>
          </app-card-header>
          <app-card-content class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Username</span>
              <span class="font-medium">{{ user()?.username ?? '—' }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Name</span>
              <span class="font-medium">{{ fullName() || '—' }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Email</span>
              <span class="font-medium">{{ user()?.email || '—' }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Role</span>
              @if (user(); as u) {
                <span appRoleBadge [role]="u.role"></span>
              }
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Status</span>
              <span class="font-medium">{{ user()?.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
          </app-card-content>
        </app-card>

        <app-card>
          <app-card-header>
            <app-card-title>Change password</app-card-title>
            <app-card-description>Update your account password.</app-card-description>
          </app-card-header>
          <app-card-content>
            <div class="space-y-4">
              <div class="space-y-2">
                <label appLabel for="old-password">Current password</label>
                <input appInput id="old-password" type="password" autocomplete="current-password" [(ngModel)]="password.old_password" name="old_password" />
              </div>
              <div class="space-y-2">
                <label appLabel for="new-password">New password</label>
                <input appInput id="new-password" type="password" autocomplete="new-password" [(ngModel)]="password.new_password" name="new_password" />
              </div>
              <div class="space-y-2">
                <label appLabel for="confirm-new-password">Confirm new password</label>
                <input appInput id="confirm-new-password" type="password" autocomplete="new-password" [(ngModel)]="password.confirm_new_password" name="confirm_new_password" />
              </div>
              <button appButton [disabled]="submitting()" (click)="onChangePassword()">
                <ng-icon name="keyRound" size="16" />
                {{ submitting() ? 'Updating…' : 'Update password' }}
              </button>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <app-card>
        <app-card-header>
          <app-card-title>API access</app-card-title>
          <app-card-description>Base URL and personal access token for integrations.</app-card-description>
        </app-card-header>
        <app-card-content class="space-y-4 text-sm">
          <div class="flex flex-col gap-1.5">
            <label appLabel>API base URL</label>
            <code class="rounded-md bg-muted px-3 py-2 text-xs">{{ apiBase }}</code>
          </div>
          <div class="flex flex-col gap-1.5">
            <label appLabel>Access token</label>
            <div class="flex items-center gap-2">
              <code class="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                {{ showToken() ? accessToken : maskedToken }}
              </code>
              <button appButton variant="outline" size="icon" (click)="toggleShow()" aria-label="Show or hide token">
                <ng-icon [name]="showToken() ? 'eyeOff' : 'eye'" size="16" />
              </button>
              <button appButton variant="outline" [disabled]="!accessToken" (click)="copyToken()">
                <ng-icon [name]="tokenCopied() ? 'check' : 'copy'" size="16" />
                {{ tokenCopied() ? 'Copied' : 'Copy' }}
              </button>
            </div>
            @if (!accessToken) {
              <p class="text-xs text-muted-foreground">You must be signed in to view a token.</p>
            }
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class AccountComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  protected submitting = signal(false);
  protected showToken = signal(false);
  protected tokenCopied = signal(false);
  protected password = { old_password: '', new_password: '', confirm_new_password: '' };

  readonly apiBase = this.api.baseUrl();
  readonly accessToken = tokenStore.getAccess() ?? '';

  user = this.auth.user;
  fullName = this.auth.fullName;

  get maskedToken(): string {
    return this.accessToken.slice(0, 12) + '••••••••••••';
  }

  toggleShow(): void {
    this.showToken.set(!this.showToken());
  }

  async copyToken(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.accessToken);
      this.tokenCopied.set(true);
      setTimeout(() => this.tokenCopied.set(false), 1500);
    } catch {
      this.toast.error('Could not copy token');
    }
  }

  async onChangePassword(): Promise<void> {
    if (
      !this.password.old_password ||
      !this.password.new_password ||
      !this.password.confirm_new_password
    ) {
      return;
    }
    this.submitting.set(true);
    try {
      await lastValueFrom(
        this.api.post('/users/change_password/', {
          old_password: this.password.old_password,
          new_password: this.password.new_password,
          confirm_new_password: this.password.confirm_new_password,
        }),
      );
      this.toast.success('Password changed');
      this.password = { old_password: '', new_password: '', confirm_new_password: '' };
    } catch (error) {
      this.toast.error(apiErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}

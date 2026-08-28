import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/api/api.service';
import { ToastService } from '../../core/toast.service';
import { sharedUi } from '../../shared/ui';

@Component({
  selector: 'app-login',
  imports: [NgIcon, FormsModule, ...sharedUi],
  template: `
    <div class="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div class="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="flex flex-col space-y-1.5 p-6 text-center">
          <span class="mx-auto mb-2 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ng-icon name="wrench" size="24" />
          </span>
          <h3 class="text-xl font-semibold leading-none tracking-tight">Sign in</h3>
          <p class="text-sm text-muted-foreground">Access the FieldService management console</p>
        </div>
        <div class="p-6 pt-0">
          <form (ngSubmit)="login()" class="space-y-4">
            <div class="space-y-2">
              <label appLabel for="username">Username</label>
              <input appInput id="username" autocomplete="username" [(ngModel)]="form.username" name="username" />
            </div>
            <div class="space-y-2">
              <label appLabel for="password">Password</label>
              <input
                appInput
                id="password"
                type="password"
                autocomplete="current-password"
                [(ngModel)]="form.password"
                name="password"
              />
            </div>
            <button appButton type="submit" class="w-full" [disabled]="submitting()">
              {{ submitting() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly submitting = signal(false);
  protected form = { username: '', password: '' };

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  async login(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.auth.login(this.form.username, this.form.password);
      this.toast.success('Signed in');
      this.router.navigate(['/admin']);
    } catch (error) {
      this.toast.error(apiErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}

import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { tokenStore } from '../api/token-store';
import { Role, TokenPair, User } from '../api/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  private initPromise: Promise<void> | null = null;

  constructor(private api: ApiService) {}

  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    return this.initPromise;
  }

  private async initialize(): Promise<void> {
    if (!tokenStore.getAccess()) {
      this.loading.set(false);
      return;
    }
    try {
      const me = await lastValueFrom(this.api.get<User>('/users/me/'));
      this.user.set(me);
    } catch {
      tokenStore.clear();
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async login(username: string, password: string): Promise<void> {
    const pair = await lastValueFrom(
      this.api.post<TokenPair>('/auth/token/', { username, password }),
    );
    tokenStore.set(pair.access, pair.refresh);
    const me = await lastValueFrom(this.api.get<User>('/users/me/')).catch(() => null);
    this.user.set(me);
  }

  logout(): void {
    tokenStore.clear();
    this.user.set(null);
  }

  hasRole(roles: Role[]): boolean {
    const role = this.user()?.role;
    return !!role && roles.includes(role);
  }

  fullName(): string {
    const u = this.user();
    if (!u) return '';
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
  }
}

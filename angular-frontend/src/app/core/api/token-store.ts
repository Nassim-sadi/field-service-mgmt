const ACCESS_KEY = 'fs_access';
const REFRESH_KEY = 'fs_refresh';

export class TokenStore {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export const tokenStore = new TokenStore();

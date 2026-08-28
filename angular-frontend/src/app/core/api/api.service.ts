import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiBase = API_URL;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: ListParams | object): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    return this.http.get<T>(`${this.apiBase}${path}`, { params: httpParams });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiBase}${path}`, body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${this.apiBase}${path}`, body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiBase}${path}`, body ?? {});
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}${path}`);
  }

  baseUrl(): string {
    return this.apiBase;
  }
}

export function apiErrorMessage(error: unknown): string {
  const err = error as { error?: unknown; status?: number };
  if (err?.error && typeof err.error === 'object') {
    const data = err.error as Record<string, unknown>;
    if (typeof data['detail'] === 'string') return data['detail'];
    const first = Object.values(data)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return 'Something went wrong';
}

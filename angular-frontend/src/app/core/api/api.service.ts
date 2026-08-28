import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DEMO_MODE } from '../demo';

const API_URL = environment.apiUrl;

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiBase = API_URL;
  private demoOverlays = new Map<string, { created: any[]; updated: Map<string, any>; deleted: Set<string> }>();

  constructor(private http: HttpClient) {}

  private demoKey(path: string): string {
    const m = path.match(/^\/([^/?]+)/);
    return m ? m[1] : path;
  }
  private demoId(path: string): string | null {
    const m = path.match(/\/(\d+)\/?$/);
    return m ? m[1] : null;
  }
  private getDemoOverlay(key: string) {
    if (!this.demoOverlays.has(key)) this.demoOverlays.set(key, { created: [], updated: new Map(), deleted: new Set() });
    return this.demoOverlays.get(key)!;
  }

  get<T>(path: string, params?: ListParams | object): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    const obs = this.http.get<T>(`${this.apiBase}${path}`, { params: httpParams });
    if (!DEMO_MODE) return obs;
    const key = this.demoKey(path);
    return obs.pipe(
      map((data: any) => {
        const ov = this.demoOverlays.get(key);
        if (!ov || (!ov.created.length && !ov.updated.size && !ov.deleted.size)) return data;
        if (data && Array.isArray(data.results)) {
          const updatedResults = data.results
            .map((item: any) => (ov.updated.has(String(item.id)) ? { ...item, ...ov.updated.get(String(item.id)) } : item))
            .filter((item: any) => !ov.deleted.has(String(item.id)));
          const createdFiltered = ov.created.filter((c: any) => !ov.deleted.has(String(c.id)));
          data.results = [...createdFiltered, ...updatedResults];
          data.count = data.results.length;
        } else if (Array.isArray(data)) {
          const merged = [...ov.created, ...data]
            .map((item: any) => (ov.updated.has(String(item.id)) ? { ...item, ...ov.updated.get(String(item.id)) } : item))
            .filter((item: any) => !ov.deleted.has(String(item.id)));
          return merged as T;
        } else if (data && typeof data === 'object' && ov.updated.has(String((data as any).id))) {
          return { ...data, ...ov.updated.get(String((data as any).id)) } as T;
        }
        return data;
      }),
    );
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    if (!DEMO_MODE) return this.http.post<T>(`${this.apiBase}${path}`, body ?? {});
    const key = this.demoKey(path);
    const ov = this.getDemoOverlay(key);
    const fake: any = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...(body as object),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    ov.created.unshift(fake);
    return of(fake as T);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    if (!DEMO_MODE) return this.http.patch<T>(`${this.apiBase}${path}`, body ?? {});
    const key = this.demoKey(path);
    const ov = this.getDemoOverlay(key);
    const id = this.demoId(path);
    if (id) {
      ov.updated.set(String(id), body as any);
      const idx = ov.created.findIndex((c: any) => String(c.id) === String(id));
      if (idx >= 0) Object.assign(ov.created[idx], body);
    }
    return of({ id, ...(body as object) } as T);
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    if (!DEMO_MODE) return this.http.put<T>(`${this.apiBase}${path}`, body ?? {});
    return this.patch<T>(path, body);
  }

  delete(path: string): Observable<void> {
    if (!DEMO_MODE) return this.http.delete<void>(`${this.apiBase}${path}`);
    const key = this.demoKey(path);
    const ov = this.getDemoOverlay(key);
    const id = this.demoId(path);
    if (id) {
      ov.deleted.add(String(id));
      ov.created = ov.created.filter((c: any) => String(c.id) !== String(id));
      ov.updated.delete(String(id));
    }
    return of(undefined as void);
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

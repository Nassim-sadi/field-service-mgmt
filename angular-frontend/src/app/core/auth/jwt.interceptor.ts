import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { ApiService } from '../api/api.service';
import { tokenStore } from '../api/token-store';

function refreshAccessToken(api: ApiService): Promise<void> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return Promise.reject(new Error('No refresh token'));
  return api
    .post<{ access: string }>('/auth/token/refresh/', { refresh })
    .toPromise()
    .then((data) => {
      tokenStore.set(data!.access, refresh);
    });
}

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const api = inject(ApiService);
  const router = inject(Router);
  const isAuthRequest = req.url.includes('/auth/token/');

  const token = tokenStore.getAccess();
  const clone = token && !isAuthRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clone).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRequest) {
        return throwError(() => error);
      }
      return from(refreshAccessToken(api)).pipe(
        catchError(() => {
          tokenStore.clear();
          router.navigate(['/login']);
          return throwError(() => error);
        }),
        switchMap(() => {
          const newToken = tokenStore.getAccess();
          const retried = clone.clone({
            setHeaders: newToken ? { Authorization: `Bearer ${newToken}` } : {},
          });
          return next(retried);
        }),
      );
    }),
  );
};

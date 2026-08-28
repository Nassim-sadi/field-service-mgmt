import { inject, Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api/api.service';
import { type Paginated } from './api/types';

export interface PagedListOptions {
  url: string;
  queryKey: unknown[];
  search: Signal<string>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  extra?: Signal<Record<string, string | number | null | undefined>>;
}

export interface PagedList<T> {
  data: Signal<Paginated<T> | undefined>;
  isLoading: Signal<boolean>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function pagedList<T>(options: PagedListOptions): PagedList<T> {
  const api = inject(ApiService);

  const query = injectQuery<PaginationWithResults<T>>(() => ({
    queryKey: [
      ...options.queryKey,
      { search: options.search(), page: options.page(), pageSize: options.pageSize(), extra: options.extra?.() },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: options.page(),
        page_size: options.pageSize(),
      };
      if (options.search()) params['search'] = options.search();
      const extra = options.extra?.() ?? {};
      for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined && value !== null && value !== '') params[key] = value;
      }
      return lastValueFrom(api.get<Paginated<T>>(options.url, params));
    },
  }));

  return {
    data: query.data as Signal<Paginated<T> | undefined>,
    isLoading: query.isLoading,
    page: options.page,
    pageSize: options.pageSize,
    setPage: (page: number) => options.page.set(page),
    setPageSize: (pageSize: number) => {
      options.pageSize.set(pageSize);
      options.page.set(1);
    },
  };
}

type PaginationWithResults<T> = Paginated<T>;

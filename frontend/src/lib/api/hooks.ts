import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Paginated } from './types'

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

interface ListConfig {
  url: string
  queryKey: readonly unknown[]
  page?: number
  pageSize?: number
  search?: string
  params?: Record<string, string | number | boolean | undefined>
}

export function usePaginatedList<T>({
  url,
  queryKey,
  page = 1,
  pageSize = 25,
  search,
  params = {},
}: ListConfig) {
  const queryParams: Record<string, string | number | undefined> = {
    page,
    page_size: pageSize,
    ...params,
  }
  if (search) queryParams.search = search

  return useQuery({
    queryKey: [...queryKey, { page, pageSize, search }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<T>>(url, { params: queryParams })
      return data
    },
  })
}

const PAGE_SIZE_KEY = 'fs_page_size'

interface PagedListConfig {
  queryKey: readonly unknown[]
  url: string
  search?: string
  resetOn?: string | number
  params?: Record<string, string | number | boolean | undefined>
}

export function usePagedList<T>({
  queryKey,
  url,
  search,
  resetOn,
  params = {},
}: PagedListConfig) {
  const debouncedSearch = useDebouncedValue(search ?? '')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(
    () => Number(localStorage.getItem(PAGE_SIZE_KEY)) || 25
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, resetOn])

  const query = usePaginatedList<T>({
    url,
    queryKey,
    page,
    pageSize,
    search: debouncedSearch || undefined,
    params,
  })

  const handlePageSizeChange = (size: number) => {
    localStorage.setItem(PAGE_SIZE_KEY, String(size))
    setPageSize(size)
    setPage(1)
  }

  return {
    ...query,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
  }
}

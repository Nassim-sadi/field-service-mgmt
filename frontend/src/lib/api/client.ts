import axios from 'axios'
import { DEMO_MODE } from '@/lib/demo'

const ACCESS_KEY = 'fs_access'
const REFRESH_KEY = 'fs_refresh'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    (typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app')
      ? 'https://bre3eze.pythonanywhere.com/api'
      : 'http://localhost:8000/api'),
})

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) throw new Error('No refresh token')
  const { data } = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, {
    refresh,
  })
  tokenStore.set(data.access, refresh)
  return data.access
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        refreshing = refreshing ?? refreshAccessToken()
        const access = await refreshing
        refreshing = null
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        refreshing = null
        tokenStore.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

if (DEMO_MODE) {
  type Overlay = { created: Record<string, unknown>[]; updated: Map<number | string, Record<string, unknown>>; deleted: Set<number | string> }
  const overlays = new Map<string, Overlay>()
  const getOverlay = (key: string): Overlay => {
    if (!overlays.has(key)) overlays.set(key, { created: [], updated: new Map(), deleted: new Set() })
    return overlays.get(key)!
  }
  const resourceKey = (url: string): string => {
    const m = url.match(/^\/([^/?]+)/)
    return m ? m[1] : url
  }
  const idFromUrl = (url: string): string | null => {
    const m = url.match(/\/(\d+)\/?$/)
    return m ? m[1] : null
  }

  const origGet = api.get.bind(api)
  const origPost = api.post.bind(api)
  const origPatch = api.patch.bind(api)
  const origPut = api.put.bind(api)
  const origDelete = api.delete.bind(api)

  api.get = async (url: string, config?: unknown) => {
    const res: any = await origGet(url, config as never)
    const key = resourceKey(url)
    const ov = overlays.get(key)
    if (!ov || (!ov.created.length && !ov.updated.size && !ov.deleted.size)) return res
    const data: any = res.data
    if (data && Array.isArray(data.results)) {
      const updatedResults = data.results
        .map((item: any) => (ov.updated.has(item.id) ? { ...item, ...ov.updated.get(item.id) } : item))
        .filter((item: any) => !ov.deleted.has(item.id))
      const createdFiltered = ov.created.filter((c: any) => !ov.deleted.has(c.id))
      data.results = [...createdFiltered, ...updatedResults]
      data.count = (data.count ?? updatedResults.length) + createdFiltered.length - (data.results.length - updatedResults.length - createdFiltered.length)
      if (typeof data.count === 'number') data.count = updatedResults.length + createdFiltered.length + (res.data.count - data.results.length + createdFiltered.length)
      // keep count as merged length for demo
      data.count = [...createdFiltered, ...updatedResults].length
    } else if (Array.isArray(data)) {
      // non-paginated list
      const merged = [...ov.created, ...data]
        .map((item: any) => (ov.updated.has(item.id) ? { ...item, ...ov.updated.get(item.id) } : item))
        .filter((item: any) => !ov.deleted.has(item.id))
      res.data = merged
    } else if (data && typeof data === 'object' && ov.updated.has(data.id)) {
      res.data = { ...data, ...ov.updated.get(data.id) }
    }
    return res
  }

  api.post = async (url: string, body?: unknown) => {
    const key = resourceKey(url)
    const ov = getOverlay(key)
    const fake: Record<string, unknown> = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...(body as Record<string, unknown>),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    ov.created.unshift(fake)
    return { data: fake } as never
  }

  api.patch = async (url: string, body?: unknown) => {
    const key = resourceKey(url)
    const ov = getOverlay(key)
    const id = idFromUrl(url)
    if (id) ov.updated.set(Number(id) || id, body as Record<string, unknown>)
    // if was a created item, patch it directly
    const createdIdx = ov.created.findIndex((c: any) => String(c.id) === String(id))
    if (createdIdx >= 0) Object.assign(ov.created[createdIdx], body)
    return { data: { id, ...(body as object) } } as never
  }

  api.put = async (url: string, body?: unknown) => {
    return (api.patch as unknown as typeof api.put)(url, body as never) as never
  }

  api.delete = async (url: string) => {
    const key = resourceKey(url)
    const ov = getOverlay(key)
    const id = idFromUrl(url)
    if (id) {
      ov.deleted.add(Number(id) || id)
      ov.created = ov.created.filter((c: any) => String(c.id) !== String(id))
      ov.updated.delete(Number(id) || (id as unknown as number))
    }
    return { data: undefined } as never
  }

  // keep originals for reference if needed
  void origPost; void origPatch; void origPut; void origDelete
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    if (typeof data?.detail === 'string') return data.detail
    if (data && typeof data === 'object') {
      const first = Object.values(data)[0]
      if (Array.isArray(first)) return String(first[0])
      if (typeof first === 'string') return first
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}

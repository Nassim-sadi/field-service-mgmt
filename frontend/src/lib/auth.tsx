import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, tokenStore } from '@/lib/api/client'
import type { Role, TokenPair, User } from '@/lib/api/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isManagement: boolean
  isTechnician: boolean
  isCustomer: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get<User>('/users/me/')
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!tokenStore.getAccess()) {
      setLoading(false)
      return
    }
    fetchMe().then((data) => {
      if (!active) return
      setUser(data)
      if (!data) tokenStore.clear()
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<TokenPair>('/auth/token/', { username, password })
    tokenStore.set(data.access, data.refresh)
    const me = await fetchMe()
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    isManagement: user?.role === 'admin' || user?.role === 'manager',
    isTechnician: user?.role === 'technician',
    isCustomer: user?.role === 'customer',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function hasRole(user: User | null, roles: Role[]): boolean {
  return !!user && roles.includes(user.role)
}

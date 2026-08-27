import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/api/types'

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[]
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="grid min-h-svh place-items-center" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

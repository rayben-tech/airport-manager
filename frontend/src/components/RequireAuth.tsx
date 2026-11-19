import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { UserRole } from '../types'
import { Skeleton } from './States'

/** Route guard: login required, and optionally a role (otherwise back to /). */
export default function RequireAuth({ role }: { role?: UserRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="space-y-4 px-5 pt-10">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (role && user.userRole !== role) return <Navigate to="/" replace />
  return <Outlet />
}

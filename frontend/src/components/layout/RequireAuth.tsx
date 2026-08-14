import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return <Outlet />
}

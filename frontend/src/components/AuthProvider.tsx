import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, login as apiLogin, onUnauthorized, tokenStore } from '../lib/api'
import { AuthContext, type AuthContextValue } from '../lib/auth'
import type { User } from '../types'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  // restore the session from the stored token
  useEffect(() => {
    if (!tokenStore.get()) return
    let active = true
    // a 401 clears the token inside the api layer; a network error keeps it for the next visit
    getCurrentUser()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // any 401 on an authenticated call: the token is already cleared, go back to the login page
  useEffect(() => {
    onUnauthorized(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => onUnauthorized(null)
  }, [navigate])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    tokenStore.set(res.accessToken)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo<AuthContextValue>(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

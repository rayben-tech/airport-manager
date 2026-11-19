import { createContext, useContext } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  user: User | null
  /** true while the stored token is being checked on startup */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

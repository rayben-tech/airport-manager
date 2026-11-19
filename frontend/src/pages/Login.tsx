import { Lock, Mail, Plane } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.userRole === 'admin' ? '/admin' : (from ?? '/')} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const u = await login(email.trim(), password)
      navigate(u.userRole === 'admin' ? '/admin' : (from ?? '/'), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible. Réessayez.')
      setSubmitting(false)
    }
  }

  const field = 'frost-field h-[52px] w-full'
  return (
    <div className="flex min-h-full flex-col justify-center px-5 py-10">
      <form onSubmit={submit} className="frost-card rounded-panel px-5 pb-6 pt-7" noValidate>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-white shadow-nav-glow ring-4 ring-white/60">
          <Plane size={30} fill="currentColor" />
        </div>
        <h1 className="mt-4 text-center text-heading font-bold">Connexion</h1>
        <p className="mt-1 text-center text-label text-ink-soft">Aéroport Mohammed V · Casablanca</p>

        <label className={`${field} mt-6`}>
          <Mail size={20} className="shrink-0 text-ink-soft" />
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-soft"
          />
        </label>
        <label className={`${field} mt-3`}>
          <Lock size={20} className="shrink-0 text-ink-soft" />
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            aria-label="Mot de passe"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-soft"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 rounded-chip bg-danger/12 px-3 py-2 text-label font-semibold text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !email || !password} className="btn-cta mt-5 disabled:opacity-60">
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="mt-4 text-center text-small text-ink-soft">
          Compte de démo : <b className="text-ink">wissal@email.com</b> / <b className="text-ink">demo1234</b>
        </p>
      </form>
    </div>
  )
}

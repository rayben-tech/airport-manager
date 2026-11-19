import { ArrowLeft, ArrowRight, Bell, ChevronRight, CircleHelp, Info, LogOut, Pencil, SlidersHorizontal, User, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import PageHeader from '../components/PageHeader'
import PremiumBanner from '../components/PremiumBanner'
import { ErrorCard, Skeleton } from '../components/States'
import { getNotifications, getProfile } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useApi } from '../lib/useApi'

type Item = { label: string; icon: LucideIcon; notifications?: boolean }

const items: Item[] = [
  { label: 'Mes informations', icon: User },
  { label: 'Mes préférences', icon: SlidersHorizontal },
  { label: 'Notifications', icon: Bell, notifications: true },
  { label: 'Aide & Support', icon: CircleHelp },
  { label: 'À propos', icon: Info },
]

export default function Settings() {
  const { logout } = useAuth()
  const [open, setOpen] = useState<Item | null>(null)
  const profile = useApi(getProfile, [])
  const notifications = useApi(getNotifications, [])
  const unread = notifications.data?.filter((n) => !n.isRead).length ?? 0

  if (open) {
    return (
      <div className="px-5">
        <PageHeader title={open.label} left={<button type="button" aria-label="Retour" onClick={() => setOpen(null)} className="round-glass"><ArrowLeft size={22} /></button>} />
        <div className="mt-10">
          <ComingSoon icon={open.icon} title={open.label} onBack={() => setOpen(null)} />
        </div>
      </div>
    )
  }

  const p = profile.data
  return (
    <div className="px-5">
      <PageHeader title="Paramètres" />

      {profile.loading && <Skeleton className="mt-5 h-16 rounded-full" />}
      {profile.error && <ErrorCard message={profile.error.message} onRetry={profile.reload} className="mt-5" />}
      {p && (
        <div className="mt-5 flex items-center gap-4 text-white">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-greeting font-bold shadow-nav-glow ring-2 ring-white/50">
            {p.firstName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-dest font-bold">{p.firstName}</p>
            <p className="truncate text-label text-white/80">{p.email}</p>
          </div>
          <span className="round-glass">
            <Pencil size={18} />
          </span>
        </div>
      )}

      {p?.loyaltyTier === 'premium' && (
        <div className="mt-4">
          <PremiumBanner subtitle="Vos avantages" />
        </div>
      )}

      <div className="frost-card mt-4 divide-y divide-ink/8 rounded-panel">
        {items.map((it) => (
          <button key={it.label} type="button" onClick={() => setOpen(it)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
              <it.icon size={20} strokeWidth={2} />
            </span>
            <span className="flex-1 text-strong font-semibold">{it.label}</span>
            {it.notifications && unread > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-small font-bold text-white">{unread}</span>
            ) : (
              <ChevronRight size={20} strokeWidth={2.25} />
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={logout}
        className="glass-light mt-4 flex h-14 w-full items-center gap-3 rounded-3xl px-4 text-left font-bold text-rose-700 [--glass-light-bg:rgba(255,120,150,0.3)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
          <LogOut size={20} strokeWidth={2} />
        </span>
        <span className="flex-1 text-strong">Se déconnecter</span>
        <ArrowRight size={20} strokeWidth={2.25} />
      </button>
    </div>
  )
}

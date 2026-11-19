import { ArrowLeft, ArrowRight, Bell, ChevronRight, CircleHelp, Info, LogOut, Pencil, SlidersHorizontal, User, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ComingSoon from '../components/ComingSoon'
import PageHeader from '../components/PageHeader'
import PremiumBanner from '../components/PremiumBanner'
import { passenger } from '../data/passenger'

const items: { label: string; icon: LucideIcon; badge?: number }[] = [
  { label: 'Mes informations', icon: User },
  { label: 'Mes préférences', icon: SlidersHorizontal },
  { label: 'Notifications', icon: Bell, badge: 2 },
  { label: 'Aide & Support', icon: CircleHelp },
  { label: 'À propos', icon: Info },
]

export default function Settings() {
  const [open, setOpen] = useState<(typeof items)[number] | null>(null)

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

  return (
    <div className="px-5">
      <PageHeader title="Paramètres" />

      <div className="mt-5 flex items-center gap-4 text-white">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-greeting font-bold shadow-nav-glow ring-2 ring-white/50">
          {passenger.firstName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-dest font-bold">{passenger.firstName}</p>
          <p className="truncate text-label text-white/80">{passenger.email}</p>
        </div>
        <span className="round-glass">
          <Pencil size={18} />
        </span>
      </div>

      <div className="mt-4">
        <PremiumBanner subtitle="Vos avantages" />
      </div>

      <div className="frost-card mt-4 divide-y divide-ink/8 rounded-panel">
        {items.map((it) => (
          <button key={it.label} type="button" onClick={() => setOpen(it)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
              <it.icon size={20} strokeWidth={2} />
            </span>
            <span className="flex-1 text-strong font-semibold">{it.label}</span>
            {it.badge ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-small font-bold text-white">{it.badge}</span>
            ) : (
              <ChevronRight size={20} strokeWidth={2.25} />
            )}
          </button>
        ))}
      </div>

      <Link
        to="/"
        className="glass-light mt-4 flex h-14 items-center gap-3 rounded-3xl px-4 font-bold text-rose-700 [--glass-light-bg:rgba(255,120,150,0.3)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
          <LogOut size={20} strokeWidth={2} />
        </span>
        <span className="flex-1 text-strong">Se déconnecter</span>
        <ArrowRight size={20} strokeWidth={2.25} />
      </Link>
    </div>
  )
}

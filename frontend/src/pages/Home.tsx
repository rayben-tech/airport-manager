import { Bell, Plane, PlaneTakeoff, Search, SlidersHorizontal } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import {
  BriefcaseDuo,
  CalendarDuo,
  DotsDuo,
  HeadsetDuo,
  LuggageDuo,
  PlaneDuo,
  ScanQrDuo,
} from '../components/icons'
import { getNextFlight, getNotifications, getProfile } from '../lib/api'
import { STATUS_LABEL, formatTime } from '../lib/format'
import { useApi } from '../lib/useApi'
import type { FlightStatus } from '../types'

/** Solid status pill colors for the flight card. */
const STATUS_PILL: Record<FlightStatus, string> = {
  on_time: 'bg-success-bg',
  boarding: 'bg-success-bg',
  delayed: 'bg-warning-bg',
  cancelled: 'bg-danger',
  departed: 'bg-ink-soft',
  landed: 'bg-ink-soft',
}

type Tile = { to: string; label: string; icon: ComponentType<{ size?: number; className?: string }> }

const row1: Tile[] = [
  { to: '/vols', label: 'Mes vols', icon: PlaneDuo },
  { to: '/vols', label: 'Check-in', icon: BriefcaseDuo },
  { to: '/profil', label: 'Scanner billet', icon: ScanQrDuo },
  { to: '/bagages', label: 'Bagages', icon: LuggageDuo },
]
const row2: Tile[] = [
  { to: '/vols', label: 'Mes réservations', icon: CalendarDuo },
  { to: '/parametres', label: 'Assistance', icon: HeadsetDuo },
  { to: '/services', label: 'Plus', icon: DotsDuo },
]

function QuickTile({ to, label, icon: Icon }: Tile) {
  return (
    <Link
      to={to}
      className="flex h-[76px] flex-col items-center justify-center gap-1 rounded-tile-lg border border-white/80 bg-white/70 px-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
    >
      <Icon size={30} className="text-btn-from" />
      <span className="text-center text-tiny font-bold leading-tight text-ink">{label}</span>
    </Link>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const profile = useApi(getProfile, [])
  const next = useApi(getNextFlight, [])
  const notifications = useApi(getNotifications, [])
  const unread = notifications.data?.filter((n) => !n.isRead).length ?? 0
  const flight = next.data?.flight
  const noUpcoming = next.error?.status === 404

  return (
    <div className="px-5 pt-10 text-ink">
      <div className="flex items-center justify-between px-1">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 shadow-[0_0_22px_rgba(255,255,255,0.45)] ring-[1.5px] ring-white/60 backdrop-blur-md">
          <Plane size={28} strokeWidth={2} className="text-white" fill="currentColor" />
        </div>
        <Link
          to="/parametres"
          aria-label={unread ? `Notifications (${unread} non lues)` : 'Notifications'}
          className="glass-light relative flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Bell size={22} strokeWidth={2} className="text-ink" />
          {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />}
        </Link>
      </div>

      <div className="mt-7 px-1">
        {profile.data || profile.error ? (
          <h1 className="text-greeting font-bold leading-tight">Bonjour{profile.data ? ` ${profile.data.firstName}` : ''} !</h1>
        ) : (
          <Skeleton className="h-8 w-52 rounded-full" />
        )}
        <p className="mt-0.5 flex items-center gap-1.5 text-body font-medium">
          Bon voyage <Plane size={16} className="text-sky" fill="currentColor" />
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate('/recherche')}
        className="glass-light mt-6 flex h-[52px] w-full items-center gap-3 rounded-full px-5 text-left text-body text-ink-soft"
      >
        <Search size={20} />
        <span className="flex-1">Rechercher un vol...</span>
        <SlidersHorizontal size={20} className="text-ink" />
      </button>

      {next.loading && <Skeleton className="mt-3 h-[140px] rounded-panel" />}
      {noUpcoming && (
        <EmptyState
          icon={PlaneTakeoff}
          title="Aucun vol à venir"
          text="Vos prochains vols apparaîtront ici."
          className="mt-3 rounded-panel"
          action={
            <Link to="/recherche-vol" className="mt-3 text-label font-bold text-primary">
              Rechercher un vol →
            </Link>
          }
        />
      )}
      {next.error && !noUpcoming && <ErrorCard message={next.error.message} onRetry={next.reload} className="mt-3 rounded-panel" />}
      {flight && (
        <Link to={`/vols/${flight.id}`} className="glass-light mt-3 block rounded-panel p-4">
          <div className="flex items-end justify-between">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-small font-bold text-white ${STATUS_PILL[flight.status]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {STATUS_LABEL[flight.status]}
            </span>
            <span className="text-small font-semibold">Départ</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-flight-lg font-bold leading-tight">{flight.flightNumber}</p>
            <p className="text-flight font-bold leading-tight">{formatTime(flight.departsAt)}</p>
          </div>
          <p className="text-label text-ink-soft/80">
            {flight.origin.city} ({flight.origin.iataCode}) → {flight.destination.city} ({flight.destination.iataCode})
          </p>
          <p className="mt-3 text-center text-body font-bold text-primary">Voir les détails →</p>
        </Link>
      )}

      <section className="glass-light mt-3 rounded-panel p-4 [--glass-light-blur:32px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-title font-bold">Accès rapide</h2>
          <Link to="/vols" className="text-label font-bold text-primary">
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {row1.map((t) => (
            <QuickTile key={t.label} {...t} />
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {row2.map((t) => (
            <QuickTile key={t.label} {...t} />
          ))}
        </div>
      </section>
    </div>
  )
}

import { ArrowRight, ChevronRight, Crown, Pencil, Plane, PlaneTakeoff, Settings, Star, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import QrCode from '../components/QrCode'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import StatusBadge from '../components/StatusBadge'
import { PlaneDuo, SuitcaseSolid } from '../components/icons'
import { getNextFlight, getProfile } from '../lib/api'
import { formatTime } from '../lib/format'
import { useApi } from '../lib/useApi'

const violetTile = 'bg-linear-to-br from-primary to-bag-to'

function Stat({ tile, icon, value, label }: { tile: string; icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile}`}>{icon}</span>
      <p className="mt-1.5 text-heading font-extrabold leading-tight">{value}</p>
      <p className="text-small text-ink-soft">{label}</p>
    </div>
  )
}

export default function Profile() {
  const profile = useApi(getProfile, [])
  const next = useApi(getNextFlight, [])
  const p = profile.data
  const flight = next.data?.flight

  return (
    <div className="px-5 pt-6">
      <header className="flex items-center justify-between text-white">
        <h1 className="text-value font-bold">Mon profil</h1>
        <Link
          to="/parametres"
          aria-label="Paramètres"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md"
        >
          <Settings size={20} />
        </Link>
      </header>

      {profile.loading && (
        <div className="mt-1 flex flex-col items-center">
          <Skeleton className="h-[92px] w-[92px] rounded-full" />
          <Skeleton className="mt-3 h-6 w-56 rounded-full" />
          <Skeleton className="mt-4 h-16 w-full rounded-3xl" />
          <Skeleton className="mt-4 h-[104px] w-full rounded-3xl" />
        </div>
      )}
      {profile.error && <ErrorCard message={profile.error.message} onRetry={profile.reload} className="mt-4" />}

      {p && (
        <>
          <div className="mt-1 flex flex-col items-center text-white">
            <div className="relative">
              <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-avatar font-bold shadow-nav-glow ring-2 ring-white/50">
                {p.firstName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink ring-2 ring-white/40">
                <Pencil size={13} strokeWidth={2.25} />
              </span>
            </div>
            <p className="mt-3 text-dest font-bold drop-shadow-sm">
              {p.firstName} {p.lastName}
            </p>
            <p className="text-label text-white/80">{p.email}</p>
          </div>

          {p.loyaltyTier === 'premium' && (
            <div className="premium mt-4 flex h-16 items-center gap-3 rounded-3xl border border-white/30 px-4 text-white shadow-nav-glow">
              <Crown size={32} className="stroke-amber-500 text-gold" fill="currentColor" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-value font-bold leading-tight">Voyageur Premium</p>
                <p className="text-small text-white/80">Profitez de plus d'avantages</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <ChevronRight size={18} />
              </span>
            </div>
          )}

          <div className="glass-light mt-4 grid grid-cols-3 divide-x divide-ink/10 rounded-3xl px-2 py-3 text-ink">
            <Stat tile="bg-primary/15" icon={<PlaneDuo size={22} className="text-primary" />} value={p.stats.completedFlights} label="Vols" />
            <Stat
              tile={violetTile}
              icon={<SuitcaseSolid size={20} className="text-white" />}
              value={p.stats.confirmedReservations}
              label="Réservations"
            />
            <Stat
              tile={violetTile}
              icon={<Star size={20} className="text-gold" fill="currentColor" strokeWidth={1.5} />}
              value={p.rating !== null ? p.rating.toFixed(1) : '—'}
              label="Note"
            />
          </div>
        </>
      )}

      {next.loading && <Skeleton className="mt-4 h-[250px] rounded-panel" />}
      {next.error?.status === 404 && <EmptyState icon={PlaneTakeoff} title="Aucun vol à venir" className="mt-4 rounded-panel" />}
      {next.error && next.error.status !== 404 && <ErrorCard message={next.error.message} onRetry={next.reload} className="mt-4 rounded-panel" />}
      {flight && (
        <div className="glass-light mt-4 rounded-panel p-4 text-ink">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-label font-bold">
              <Plane size={16} className="text-warning-bg" fill="currentColor" /> Prochain vol
            </p>
            <StatusBadge status={flight.status} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-flight-lg font-extrabold leading-tight">{flight.flightNumber}</p>
              <p className="flex items-center gap-1.5 text-value font-bold">
                {flight.origin.iataCode} <ArrowRight size={16} strokeWidth={2.5} className="text-primary" /> {flight.destination.iataCode}
              </p>
              <p className="mt-4 text-small text-ink-soft">Départ</p>
              <p className="text-heading font-extrabold leading-tight">{formatTime(flight.departsAt)}</p>
            </div>
            <div className="rounded-chip bg-white p-2">
              <QrCode seed={next.data?.ticketCode ?? flight.flightNumber} size={104} />
            </div>
          </div>
          <Link
            to={`/vols/${flight.id}`}
            className="mt-4 flex h-11 items-center justify-center rounded-[22px] border border-white/80 bg-white/50 text-body font-bold text-btn-from"
          >
            Voir le billet →
          </Link>
        </div>
      )}

      <Link to="/parametres" className="glass-light mt-4 flex h-14 items-center gap-3 rounded-3xl px-4 py-2 text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
          <User size={20} strokeWidth={2} />
        </span>
        <span className="flex-1 text-strong font-semibold">Mes informations</span>
        <ChevronRight size={20} strokeWidth={2.25} />
      </Link>
    </div>
  )
}

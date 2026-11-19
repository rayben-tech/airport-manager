import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  DoorOpen,
  Plane,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SuitcaseSolid } from '../components/icons'
import { type Flight, getFlight } from '../data/flights'
import { type Trip, type TripTab, trips } from '../data/passenger'

const tabs: { key: TripTab; label: string }[] = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passés' },
  { key: 'cancelled', label: 'Annulés' },
]

/** Pill (top right) and status line (under the route) for a trip. */
function tripStatus(trip: Trip, flight: Flight) {
  if (trip.tab === 'cancelled') return { label: 'Annulé', pill: 'bg-danger/20 text-red-700', line: 'text-red-700', dot: 'bg-danger' }
  if (trip.tab === 'past') return { label: 'Terminé', pill: 'bg-ink/10 text-ink-soft', line: 'text-ink-soft', dot: 'bg-ink-soft' }
  if (flight.status === 'Retardé')
    return { label: 'Retardé', pill: 'bg-warning-bg/20 text-orange-700', line: 'text-orange-700', dot: 'bg-warning-bg' }
  return { label: "À l'heure", pill: 'bg-success-bg/[0.22] text-green-700', line: 'text-green-600', dot: 'bg-success-bg' }
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <li className="flex h-9 items-center gap-3">
      <Icon size={18} strokeWidth={2} className="text-primary" />
      <span className="flex-1 text-label text-ink-soft">{label}</span>
      <span className="text-body font-bold">{value}</span>
    </li>
  )
}

function BagRow({ label, weight, note }: { label: string; weight: string; note?: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-linear-to-br from-primary to-bag-to text-white">
        <SuitcaseSolid size={24} />
      </span>
      <span className="flex-1 text-body font-semibold">{label}</span>
      <span className="text-right">
        <span className="block text-strong font-bold">{weight}</span>
        {note && <span className="block text-tiny text-ink-soft">{note}</span>}
      </span>
    </li>
  )
}

function Expanded({ flight }: { flight: Flight }) {
  const [bagsOpen, setBagsOpen] = useState(true)
  const departure = flight.direction === 'departure'
  const terminal = (departure ? flight.fromTerminal : flight.toTerminal).replace('Terminal ', '')

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-tile-lg bg-white/45 p-[14px]">
        <p className="mb-1 flex items-center gap-2 text-body font-bold">
          <Plane size={18} className="text-primary" fill="currentColor" /> Détails du vol
        </p>
        <ul>
          <DetailRow icon={Clock} label="Départ" value={`${flight.departureTime} - ${flight.fromCode}`} />
          <DetailRow icon={Clock} label="Arrivée" value={`${flight.arrivalTime} - ${flight.toCode}`} />
          <DetailRow icon={Building2} label="Terminal" value={terminal} />
          <DetailRow icon={DoorOpen} label="Porte" value={flight.gate} />
        </ul>
      </div>

      <div className="rounded-tile-lg border border-white/80 bg-white/40 p-[14px]">
        <button
          type="button"
          onClick={() => setBagsOpen((v) => !v)}
          aria-expanded={bagsOpen}
          className="flex w-full items-center gap-2 text-left text-body font-bold"
        >
          <SuitcaseSolid size={18} className="text-primary" />
          <span className="flex-1">Bagages</span>
          <ChevronDown size={18} className={`transition-transform ${bagsOpen ? '' : '-rotate-90'}`} />
        </button>
        {bagsOpen && (
          <ul className="mt-3 space-y-3">
            <BagRow label="Bagage cabine" weight="8 kg max" note="(55 × 35 × 25 cm)" />
            <BagRow label="Bagage en soute" weight="23 kg max" note={flight.belt ? `(Tapis ${flight.belt})` : undefined} />
          </ul>
        )}
      </div>

      <Link
        to={`/vols/${flight.id}`}
        className="flex h-12 items-center justify-center gap-2 rounded-tile border border-white/80 bg-white/50 text-strong font-bold text-btn-from"
      >
        <Ticket size={20} strokeWidth={2} /> Voir le billet
      </Link>
    </div>
  )
}

function TripCard({ trip, open, onToggle }: { trip: Trip; open: boolean; onToggle: () => void }) {
  const flight = getFlight(trip.flightId)
  if (!flight) return null
  const status = tripStatus(trip, flight)
  const roundBtn = 'flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink'

  return (
    <article className="glass-light rounded-panel p-4 text-ink">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-control border border-white/80 bg-white/70">
            <span className="text-heading font-extrabold leading-none">{trip.day}</span>
            <span className="mt-1 text-small font-semibold">{trip.month}</span>
          </span>
          <span className="min-w-0">
            <span className="block text-title font-bold leading-tight">{flight.code}</span>
            <span className="block truncate text-label text-ink-soft">
              {flight.fromCity} → {flight.toCity}
            </span>
            <span className={`mt-0.5 flex items-center gap-1.5 text-small font-semibold ${status.line}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </span>
        </button>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-tiny font-bold ${status.pill}`}>
            ● {status.label}
          </span>
          {open ? (
            <Link to={`/vols/${flight.id}`} aria-label="Voir le détail du vol" className={roundBtn}>
              <ChevronRight size={18} strokeWidth={2.25} />
            </Link>
          ) : (
            <button type="button" onClick={onToggle} aria-label="Afficher les détails" className={roundBtn}>
              <ChevronDown size={18} strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
      {open && <Expanded flight={flight} />}
    </article>
  )
}

export default function MyFlights() {
  const [tab, setTab] = useState<TripTab>('upcoming')
  const [openId, setOpenId] = useState<string | null>('AF1597')
  const list = trips.filter((t) => t.tab === tab)

  return (
    <div className="px-5 pt-6">
      <header className="flex items-center gap-2.5 text-white">
        <Plane size={24} fill="currentColor" />
        <h1 className="flex-1 text-heading font-bold">Mes vols</h1>
        <button
          type="button"
          aria-label="Calendrier"
          className="flex h-11 w-11 items-center justify-center rounded-chip border border-white/30 bg-white/15 backdrop-blur-md"
        >
          <CalendarDays size={20} />
        </button>
      </header>

      <div className="mt-4 grid grid-cols-3">
        {tabs.map((t) => (
          <div key={t.key} className="flex justify-center">
            <button
              type="button"
              onClick={() => setTab(t.key)}
              className={`h-11 rounded-full px-[22px] text-body ${
                tab === t.key
                  ? 'bg-linear-to-r from-btn-from to-nav-to font-bold text-white shadow-nav-glow'
                  : 'font-semibold text-white/90'
              }`}
            >
              {t.label}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {list.map((t) => (
          <TripCard
            key={t.flightId}
            trip={t}
            open={openId === t.flightId}
            onToggle={() => setOpenId(openId === t.flightId ? null : t.flightId)}
          />
        ))}
        {list.length === 0 && <p className="py-10 text-center text-white/80">Aucun vol.</p>}
      </div>
    </div>
  )
}

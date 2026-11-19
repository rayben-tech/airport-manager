import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  DoorOpen,
  Plane,
  Ticket,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import { SuitcaseSolid } from '../components/icons'
import { getBookings } from '../lib/api'
import { formatDayMonth, formatTime, terminalNumber } from '../lib/format'
import { useApi } from '../lib/useApi'
import type { BaggageItem, Booking, BookingTab, FlightSummary } from '../types'

const tabs: { key: BookingTab; label: string }[] = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passés' },
  { key: 'cancelled', label: 'Annulés' },
]

const EMPTY: Record<BookingTab, string> = {
  upcoming: 'Aucun vol à venir.',
  past: 'Aucun vol passé.',
  cancelled: 'Aucune réservation annulée.',
}

/** Pill (top right) and status line (under the route) for a booking. */
function bookingStatus(tab: BookingTab, flight: FlightSummary) {
  if (tab === 'cancelled' || flight.status === 'cancelled')
    return { label: 'Annulé', pill: 'bg-danger/20 text-red-700', line: 'text-red-700', dot: 'bg-danger' }
  if (tab === 'past') return { label: 'Terminé', pill: 'bg-ink/10 text-ink-soft', line: 'text-ink-soft', dot: 'bg-ink-soft' }
  if (flight.status === 'delayed')
    return { label: 'Retardé', pill: 'bg-warning-bg/20 text-orange-700', line: 'text-orange-700', dot: 'bg-warning-bg' }
  return { label: "À l'heure", pill: 'bg-success-bg/[0.22] text-green-700', line: 'text-green-600', dot: 'bg-success-bg' }
}

const kg = (n: number) => `${String(n).replace('.', ',')} kg`

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <li className="flex h-9 items-center gap-3">
      <Icon size={18} strokeWidth={2} className="text-primary" />
      <span className="flex-1 text-label text-ink-soft">{label}</span>
      <span className="text-body font-bold">{value}</span>
    </li>
  )
}

function BagRow({ item, belt }: { item: BaggageItem; belt: number | null }) {
  const label = item.label ?? (item.bagType === 'cabin' ? 'Bagage cabine' : 'Bagage en soute')
  const note = item.sizeCm ? `(${item.sizeCm.replace(/\s*x\s*/g, ' × ')} cm)` : item.bagType === 'checked' && belt ? `(Tapis ${belt})` : null
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-linear-to-br from-primary to-bag-to text-white">
        <SuitcaseSolid size={24} />
      </span>
      <span className="flex-1 text-body font-semibold">{label}</span>
      <span className="text-right">
        <span className="block text-strong font-bold">{kg(item.weightKg)}</span>
        {note && <span className="block text-tiny text-ink-soft">{note}</span>}
      </span>
    </li>
  )
}

function Expanded({ booking }: { booking: Booking }) {
  const [bagsOpen, setBagsOpen] = useState(true)
  const flight = booking.flight

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-tile-lg bg-white/45 p-[14px]">
        <p className="mb-1 flex items-center gap-2 text-body font-bold">
          <Plane size={18} className="text-primary" fill="currentColor" /> Détails du vol
        </p>
        <ul>
          <DetailRow icon={Clock} label="Départ" value={`${formatTime(flight.departsAt)} - ${flight.origin.iataCode}`} />
          <DetailRow icon={Clock} label="Arrivée" value={`${formatTime(flight.arrivesAt)} - ${flight.destination.iataCode}`} />
          <DetailRow icon={Building2} label="Terminal" value={terminalNumber(flight.terminalName)} />
          <DetailRow icon={DoorOpen} label="Porte" value={flight.gateCode ?? '—'} />
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
        {bagsOpen &&
          (booking.baggageItems.length ? (
            <ul className="mt-3 space-y-3">
              {booking.baggageItems.map((item) => (
                <BagRow key={item.id} item={item} belt={flight.beltNumber} />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-label text-ink-soft">Aucun bagage enregistré pour ce vol.</p>
          ))}
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

function TripCard({ booking, tab, open, onToggle }: { booking: Booking; tab: BookingTab; open: boolean; onToggle: () => void }) {
  const flight = booking.flight
  const status = bookingStatus(tab, flight)
  const { day, month } = formatDayMonth(flight.departsAt)
  const roundBtn = 'flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink'

  return (
    <article className="glass-light rounded-panel p-4 text-ink">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-control border border-white/80 bg-white/70">
            <span className="text-heading font-extrabold leading-none">{day}</span>
            <span className="mt-1 text-small font-semibold">{month}</span>
          </span>
          <span className="min-w-0">
            <span className="block text-title font-bold leading-tight">{flight.flightNumber}</span>
            <span className="block truncate text-label text-ink-soft">
              {flight.origin.city} → {flight.destination.city}
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
      {open && <Expanded booking={booking} />}
    </article>
  )
}

export default function MyFlights() {
  const [params, setParams] = useSearchParams()
  const origin = params.get('origin')
  const destination = params.get('destination')
  const [tab, setTab] = useState<BookingTab>('upcoming')
  // undefined = nothing chosen yet: the first card of the tab is open
  const [openId, setOpenId] = useState<number | null | undefined>(undefined)
  const bookings = useApi(() => getBookings(tab), [tab])

  const list = (bookings.data ?? []).filter(
    (b) => (!origin || b.flight.origin.iataCode === origin) && (!destination || b.flight.destination.iataCode === destination),
  )
  const open = openId === undefined ? list[0]?.id : openId

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
              onClick={() => {
                setTab(t.key)
                setOpenId(undefined)
              }}
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

      {(origin || destination) && (
        <button
          type="button"
          onClick={() => setParams({})}
          className="mt-3 flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 text-label font-semibold text-ink backdrop-blur-md"
        >
          Filtre : {origin ?? '…'} → {destination ?? '…'}
          <X size={15} strokeWidth={2.5} aria-label="Retirer le filtre" />
        </button>
      )}

      <div className="mt-4 space-y-4">
        {bookings.loading && [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-panel" />)}
        {bookings.error && <ErrorCard message={bookings.error.message} onRetry={bookings.reload} className="rounded-panel" />}
        {bookings.data &&
          list.map((b) => (
            <TripCard key={b.id} booking={b} tab={tab} open={open === b.id} onToggle={() => setOpenId(open === b.id ? null : b.id)} />
          ))}
        {bookings.data && list.length === 0 && (
          <EmptyState
            icon={Plane}
            title={EMPTY[tab]}
            text={origin || destination ? 'Aucune réservation ne correspond à ce trajet.' : undefined}
            className="rounded-panel"
          />
        )}
      </div>
    </div>
  )
}

import {
  Building2,
  CalendarDays,
  Clock,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ComingSoon from '../components/ComingSoon'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import StatusBadge from '../components/StatusBadge'
import { Duotone } from '../components/icons'
import { getAdminAirlines, getAdminStats, getFlights } from '../lib/api'
import { useAuth } from '../lib/auth'
import { STATUS_LABEL, formatDate, formatTime } from '../lib/format'
import { type ApiState, useApi } from '../lib/useApi'
import type { AdminStats, FlightPage, FlightStatus } from '../types'

const menu: { label: string; icon: LucideIcon }[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard },
  { label: 'Vols', icon: Plane },
  { label: 'Compagnies', icon: Building2 },
  { label: 'Avions', icon: Plane },
  { label: 'Portes', icon: DoorOpen },
  { label: 'Terminaux', icon: Building2 },
  { label: 'Emplacements', icon: MapPin },
  { label: 'Utilisateurs', icon: Users },
]

/** Chart palette per flight status. */
const STATUS_COLOR: Record<FlightStatus, string> = {
  on_time: '#3b6fe0',
  boarding: '#22c55e',
  delayed: '#f5a94b',
  cancelled: '#ef6f7a',
  departed: '#8e94b5',
  landed: '#c4c8dc',
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const cards: { label: string; value: number; icon: LucideIcon; tile: string }[] = [
    { label: 'Vols au total', value: stats.total, icon: Plane, tile: 'bg-primary/12 text-primary' },
    { label: 'Départs', value: stats.departures, icon: PlaneTakeoff, tile: 'bg-green-500/15 text-green-600' },
    { label: 'Arrivées', value: stats.arrivals, icon: PlaneLanding, tile: 'bg-violet-500/15 text-violet-600' },
    { label: 'Retardés', value: stats.delayed, icon: Clock, tile: 'bg-orange-500/15 text-orange-600' },
  ]
  const stops = stats.statusDistribution.map((s, i) => {
    const from = stats.statusDistribution.slice(0, i).reduce((sum, x) => sum + x.percent, 0)
    return `${STATUS_COLOR[s.status]} ${from}% ${from + s.percent}%`
  })
  const maxGate = Math.max(1, ...stats.topGates.map((g) => g.departures))

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="frost-card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-chip ${c.tile}`}>
              <Duotone icon={c.icon} size={26} />
            </span>
            <div>
              <p className="text-flight-lg font-extrabold leading-none">{c.value}</p>
              <p className="mt-1 text-label text-ink-soft">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="frost-card col-span-2 rounded-panel p-6">
          <h2 className="text-title font-bold">Statistiques des vols</h2>
          {stats.total === 0 ? (
            <p className="mt-4 text-body text-ink-soft">Aucun vol ce jour-là.</p>
          ) : (
            <div className="mt-4 flex items-center gap-10">
              <div className="relative h-44 w-44">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(${stops.join(', ')})`,
                    mask: 'radial-gradient(circle, transparent 56%, #000 57%)',
                    WebkitMask: 'radial-gradient(circle, transparent 56%, #000 57%)',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-flight-lg font-extrabold leading-none">{stats.total}</span>
                  <span className="text-small text-ink-soft">vols</span>
                </div>
              </div>
              <ul className="space-y-3">
                {stats.statusDistribution.map((s) => (
                  <li key={s.status} className="flex items-center gap-3 text-body">
                    <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                    <span className="w-24 text-ink-soft">{STATUS_LABEL[s.status]}</span>
                    <b>{String(s.percent).replace('.', ',')}%</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="frost-card rounded-panel p-6">
          <h2 className="text-title font-bold">Top portes</h2>
          {stats.topGates.length === 0 && <p className="mt-4 text-body text-ink-soft">Aucun départ ce jour-là.</p>}
          <ul className="mt-4 space-y-4">
            {stats.topGates.map((g) => (
              <li key={g.gateCode}>
                <div className="flex justify-between text-body">
                  <b>{g.gateCode}</b>
                  <span className="text-ink-soft">{g.departures} vols</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-ink/8">
                  <div className="h-full rounded-full bg-linear-to-r from-btn-from to-nav-to" style={{ width: `${(g.departures / maxGate) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="frost-card overflow-hidden rounded-panel">
      <table className="w-full text-left text-body">
        <thead className="bg-white/40 text-small font-semibold text-ink-soft">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-5 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8">{children}</tbody>
      </table>
    </div>
  )
}

function Loading({ state, children }: { state: ApiState<unknown>; children: ReactNode }) {
  if (state.loading) return <Skeleton className="h-96 rounded-panel" />
  if (state.error) return <ErrorCard message={state.error.message} onRetry={state.reload} className="mx-auto max-w-md rounded-panel" />
  return <>{children}</>
}

function FlightsTable({ flights }: { flights: FlightPage }) {
  if (!flights.items.length) return <EmptyState icon={Plane} title="Aucun vol ce jour-là" className="mx-auto max-w-md" />
  return (
    <Table head={['Vol', 'Compagnie', 'Trajet', 'Heure', 'Porte', 'Statut']}>
      {flights.items.map((f) => (
        <tr key={f.id}>
          <td className="px-5 py-3 font-bold">{f.flightNumber}</td>
          <td className="px-5 py-3">{f.airline.name}</td>
          <td className="px-5 py-3">
            {f.origin.city} → {f.destination.city}
          </td>
          <td className="px-5 py-3 font-semibold">{formatTime(f.direction === 'departure' ? f.departsAt : f.arrivesAt)}</td>
          <td className="px-5 py-3">{f.gateCode ?? '—'}</td>
          <td className="px-5 py-3">
            <StatusBadge status={f.status} />
          </td>
        </tr>
      ))}
    </Table>
  )
}

export default function Admin() {
  const { logout } = useAuth()
  const [active, setActive] = useState('Tableau de bord')
  const current = menu.find((m) => m.label === active) ?? menu[0]
  const stats = useApi(getAdminStats, [])
  const day = stats.data?.date // the day chosen by the server, never the browser's clock
  const flights = useApi(() => (day ? getFlights({ date: day, pageSize: 200 }) : Promise.resolve(null)), [day])
  const airlines = useApi(getAdminAirlines, [])

  const perAirline = useMemo(() => {
    const counts = new Map<number, number>()
    for (const f of flights.data?.items ?? []) counts.set(f.airline.id, (counts.get(f.airline.id) ?? 0) + 1)
    return counts
  }, [flights.data])

  return (
    <div className="flex min-h-full text-ink">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-sidebar/70 p-5 text-white backdrop-blur-xl">
        <Link to="/" className="mb-8 flex items-center gap-3 text-heading font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to shadow-nav-glow">
            <Plane size={20} fill="currentColor" />
          </span>
          Admin
        </Link>
        <nav className="flex-1 space-y-1">
          {menu.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActive(label)}
              className={`flex h-10 w-full items-center gap-3 rounded-full px-4 text-left text-body ${
                active === label ? 'bg-linear-to-r from-btn-from to-nav-to font-bold shadow-nav-glow' : 'font-medium text-white/75 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={logout} className="flex h-10 items-center gap-3 rounded-full px-4 text-left text-body font-medium text-white/75 hover:bg-white/10">
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-greeting font-bold text-white">{active}</h1>
          <span className="glass-light flex h-10 items-center gap-2 rounded-full px-4 text-body font-semibold">
            <CalendarDays size={18} className="text-primary" /> {day ? formatDate(day) : '…'}
          </span>
        </div>
        {active === 'Tableau de bord' && <Loading state={stats}>{stats.data && <Dashboard stats={stats.data} />}</Loading>}
        {active === 'Vols' && (
          <Loading state={stats.error ? stats : flights}>{flights.data && <FlightsTable flights={flights.data} />}</Loading>
        )}
        {active === 'Compagnies' && (
          <Loading state={airlines}>
            {airlines.data && (
              <Table head={['Compagnie', 'Code', 'Vols du jour']}>
                {airlines.data.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-semibold">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: a.brandColor }} />
                      {a.name}
                    </td>
                    <td className="px-5 py-3">{a.iataCode}</td>
                    <td className="px-5 py-3">{flights.data ? (perAirline.get(a.id) ?? 0) : '…'}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Loading>
        )}
        {!['Tableau de bord', 'Vols', 'Compagnies'].includes(active) && (
          <div className="pt-10">
            <ComingSoon icon={current.icon} title={active} onBack={() => setActive('Tableau de bord')} />
          </div>
        )}
      </main>
    </div>
  )
}

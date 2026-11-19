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
import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import ComingSoon from '../components/ComingSoon'
import StatusBadge from '../components/StatusBadge'
import { Duotone } from '../components/icons'
import { adminStats, companies, flightStats, topGates } from '../data/admin'
import { flights } from '../data/flights'

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

const statCards: { label: string; value: number; icon: LucideIcon; tile: string }[] = [
  { label: 'Vols au total', value: adminStats.total, icon: Plane, tile: 'bg-primary/12 text-primary' },
  { label: 'Départs', value: adminStats.departures, icon: PlaneTakeoff, tile: 'bg-green-500/15 text-green-600' },
  { label: 'Arrivées', value: adminStats.arrivals, icon: PlaneLanding, tile: 'bg-violet-500/15 text-violet-600' },
  { label: 'Retardés', value: adminStats.delayed, icon: Clock, tile: 'bg-orange-500/15 text-orange-600' },
]

function Dashboard() {
  const stops = flightStats.map((s, i) => {
    const from = flightStats.slice(0, i).reduce((sum, x) => sum + x.value, 0)
    return `${s.color} ${from}% ${from + s.value}%`
  })
  const maxGate = Math.max(...topGates.map((g) => g.flights))

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((c) => (
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
                <span className="text-flight-lg font-extrabold leading-none">{adminStats.total}</span>
                <span className="text-small text-ink-soft">vols</span>
              </div>
            </div>
            <ul className="space-y-3">
              {flightStats.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-body">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="w-24 text-ink-soft">{s.label}</span>
                  <b>{s.value}%</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="frost-card rounded-panel p-6">
          <h2 className="text-title font-bold">Top portes</h2>
          <ul className="mt-4 space-y-4">
            {topGates.map((g) => (
              <li key={g.gate}>
                <div className="flex justify-between text-body">
                  <b>{g.gate}</b>
                  <span className="text-ink-soft">{g.flights} vols</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-ink/8">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-btn-from to-nav-to"
                    style={{ width: `${(g.flights / maxGate) * 100}%` }}
                  />
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

function FlightsTable() {
  return (
    <Table head={['Vol', 'Compagnie', 'Trajet', 'Heure', 'Porte', 'Statut']}>
      {flights.map((f) => (
        <tr key={f.id}>
          <td className="px-5 py-3 font-bold">{f.code}</td>
          <td className="px-5 py-3">{f.airline}</td>
          <td className="px-5 py-3">
            {f.fromCity} → {f.toCity}
          </td>
          <td className="px-5 py-3 font-semibold">{f.time}</td>
          <td className="px-5 py-3">{f.gate}</td>
          <td className="px-5 py-3">
            <StatusBadge status={f.status} />
          </td>
        </tr>
      ))}
    </Table>
  )
}

function CompaniesTable() {
  return (
    <Table head={['Compagnie', 'Code', 'Vols']}>
      {companies.map((c) => (
        <tr key={c.code}>
          <td className="px-5 py-3 font-semibold">{c.name}</td>
          <td className="px-5 py-3">{c.code}</td>
          <td className="px-5 py-3">{c.flights}</td>
        </tr>
      ))}
    </Table>
  )
}

export default function Admin() {
  const [active, setActive] = useState('Tableau de bord')
  const current = menu.find((m) => m.label === active) ?? menu[0]

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
                active === label
                  ? 'bg-linear-to-r from-btn-from to-nav-to font-bold shadow-nav-glow'
                  : 'font-medium text-white/75 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <Link to="/" className="flex h-10 items-center gap-3 rounded-full px-4 text-body font-medium text-white/75 hover:bg-white/10">
          <LogOut size={18} /> Déconnexion
        </Link>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-greeting font-bold text-white">{active}</h1>
          <span className="glass-light flex h-10 items-center gap-2 rounded-full px-4 text-body font-semibold">
            <CalendarDays size={18} className="text-primary" /> Aujourd'hui
          </span>
        </div>
        {active === 'Tableau de bord' && <Dashboard />}
        {active === 'Vols' && <FlightsTable />}
        {active === 'Compagnies' && <CompaniesTable />}
        {!['Tableau de bord', 'Vols', 'Compagnies'].includes(active) && (
          <div className="pt-10">
            <ComingSoon icon={current.icon} title={active} onBack={() => setActive('Tableau de bord')} />
          </div>
        )}
      </main>
    </div>
  )
}

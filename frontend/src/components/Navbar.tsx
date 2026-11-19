import { Home, MapPin, Plane, PlaneTakeoff, User, type LucideIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

type Tab = { to: string; label: string; icon: LucideIcon }

const left: Tab[] = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/carte', label: 'Carte', icon: MapPin },
]
const right: Tab[] = [
  { to: '/vols', label: 'Mes vols', icon: PlaneTakeoff },
  { to: '/profil', label: 'Profil', icon: User },
]

function Item({ to, label, icon: Icon }: Tab) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex w-16 flex-col items-center gap-1 text-tiny leading-none ${
          isActive ? 'font-bold text-primary' : 'font-medium text-ink-soft'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={24} strokeWidth={isActive ? 2 : 1.75} fill={isActive ? 'currentColor' : 'none'} />
          {label}
          <span className={`h-[3px] w-5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
        </>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  return (
    <nav className="glass-light absolute inset-x-4 bottom-4 z-20 flex h-16 items-center rounded-nav pt-2 [--glass-light-bg:rgba(255,255,255,0.65)]">
      <div className="flex flex-1 justify-evenly">
        {left.map((t) => (
          <Item key={t.to} {...t} />
        ))}
      </div>
      <div className="w-[72px] shrink-0" />
      <div className="flex flex-1 justify-evenly">
        {right.map((t) => (
          <Item key={t.to} {...t} />
        ))}
      </div>
      <Link
        to="/recherche-vol"
        aria-label="Rechercher un vol"
        className="btn-plane absolute -top-[22px] left-1/2 flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full text-white shadow-nav-glow ring-[5px] ring-white/60"
      >
        <Plane size={28} strokeWidth={2} fill="currentColor" />
      </Link>
    </nav>
  )
}

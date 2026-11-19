import { Clock, Globe, Hourglass, Info, Plane, Star, Luggage, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AirlineLogo from '../components/AirlineLogo'
import ComingSoon from '../components/ComingSoon'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Duotone } from '../components/icons'
import { getFlight } from '../data/flights'

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <li className="flex h-10 items-center gap-3">
      <Icon size={18} strokeWidth={2} className="text-primary" />
      <span className="flex-1 text-label text-ink-soft">{label}</span>
      <span className="text-body font-bold">{value}</span>
    </li>
  )
}

export default function FlightDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [favorite, setFavorite] = useState(false)
  const flight = getFlight(id)

  if (!flight) {
    return (
      <div className="px-5">
        <PageHeader title="Détails du vol" />
        <div className="mt-10">
          <ComingSoon icon={Plane} title="Vol introuvable" text="Ce vol n'existe pas ou a été supprimé." onBack={() => navigate('/recherche')} />
        </div>
      </div>
    )
  }

  const departure = flight.direction === 'departure'

  return (
    <div className="px-5">
      <PageHeader
        title="Détails du vol"
        right={
          <button type="button" aria-label="Favori" onClick={() => setFavorite((v) => !v)} className="round-glass">
            <Star size={20} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-gold' : ''} />
          </button>
        }
      />

      <GlassCard className="mt-4 space-y-4 rounded-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AirlineLogo flight={flight} size={52} />
            <div>
              <p className="text-small text-ink-soft">{flight.airline}</p>
              <p className="text-flight-lg font-extrabold leading-tight">{flight.code}</p>
            </div>
          </div>
          <StatusBadge status={flight.status} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-label font-semibold text-ink-soft">{flight.fromCity}</p>
            <p className="text-heading font-extrabold">{flight.departureTime}</p>
            <p className="text-small text-ink-soft">
              {flight.fromTerminal}
              {departure && ` • Porte ${flight.gate}`}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Plane size={22} fill="currentColor" />
          </span>
          <div className="text-right">
            <p className="text-label font-semibold text-ink-soft">{flight.toCity}</p>
            <p className="text-heading font-extrabold">{flight.arrivalTime}</p>
            <p className="text-small text-ink-soft">{flight.toTerminal}</p>
          </div>
        </div>

        <ul className="rounded-tile-lg bg-white/45 px-[14px] py-1">
          {departure ? (
            <Row icon={Clock} label="Embarquement" value={flight.boarding} />
          ) : (
            <Row icon={Luggage} label="Tapis bagages" value={flight.belt ? `n° ${flight.belt}` : '—'} />
          )}
          <Row icon={Globe} label="Pays" value={flight.country} />
          <Row icon={Plane} label="Type d'avion" value={flight.aircraft} />
          <Row icon={Hourglass} label="Durée du vol" value={flight.duration} />
        </ul>

        <div className="flex gap-3 rounded-tile-lg bg-primary/12 p-[14px] text-body">
          <Duotone icon={Info} size={22} className="shrink-0 text-primary" />
          Veuillez vous présenter à la porte au moins 30 min avant le départ.
        </div>

        <button type="button" onClick={() => navigate(`/carte?place=gate-${flight.gate}`)} className="btn-cta">
          Voir sur la carte
        </button>
      </GlassCard>
    </div>
  )
}

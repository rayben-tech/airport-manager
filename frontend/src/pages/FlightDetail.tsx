import { Clock, Globe, Hourglass, Info, Luggage, Plane, Star, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AirlineLogo from '../components/AirlineLogo'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import { ErrorCard, Skeleton } from '../components/States'
import StatusBadge from '../components/StatusBadge'
import { Duotone } from '../components/icons'
import { ApiError, addFavorite, getFavorite, getFlight, removeFavorite } from '../lib/api'
import { formatDuration, formatTime } from '../lib/format'
import { useApi } from '../lib/useApi'

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
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const flightState = useApi(() => getFlight(id), [id])
  const favoriteState = useApi(() => getFavorite(id), [id])
  // local override after a click, until the page is reloaded
  const [favorite, setFavorite] = useState<boolean | null>(null)
  const [favError, setFavError] = useState('')
  const isFavorite = favorite ?? favoriteState.data?.isFavorite ?? false

  const toggleFavorite = async () => {
    const next = !isFavorite
    setFavorite(next)
    setFavError('')
    try {
      if (next) await addFavorite(id)
      else await removeFavorite(id)
    } catch (e) {
      setFavorite(!next)
      setFavError(e instanceof ApiError ? e.message : 'Action impossible.')
    }
  }

  const header = (
    <PageHeader
      title="Détails du vol"
      right={
        <button
          type="button"
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          disabled={!flightState.data}
          onClick={toggleFavorite}
          className="round-glass"
        >
          <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-gold' : ''} />
        </button>
      }
    />
  )

  if (flightState.loading) {
    return (
      <div className="px-5">
        {header}
        <Skeleton className="mt-4 h-[520px] rounded-panel" />
      </div>
    )
  }
  if (flightState.error || !flightState.data) {
    return (
      <div className="px-5">
        {header}
        <ErrorCard
          message={flightState.error?.message ?? 'Vol introuvable.'}
          onRetry={flightState.error?.status === 404 ? undefined : flightState.reload}
          className="mt-6 rounded-panel"
        />
      </div>
    )
  }

  const flight = flightState.data
  const departure = flight.direction === 'departure'
  const country = departure ? flight.destination.country : flight.origin.country
  const gateLocation = flight.gate?.location

  return (
    <div className="space-y-4 px-5">
      {header}
      {favError && <ErrorCard message={favError} />}
      <GlassCard className="mt-4 space-y-4 rounded-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AirlineLogo airline={flight.airline} size={52} />
            <div>
              <p className="text-small text-ink-soft">{flight.airline.name}</p>
              <p className="text-flight-lg font-extrabold leading-tight">{flight.flightNumber}</p>
            </div>
          </div>
          <StatusBadge status={flight.status} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-label font-semibold text-ink-soft">{flight.origin.city}</p>
            <p className="text-heading font-extrabold">{formatTime(flight.departsAt)}</p>
            <p className="text-small text-ink-soft">
              {departure ? (flight.terminalName ?? '—') : flight.origin.iataCode}
              {departure && flight.gateCode && ` • Porte ${flight.gateCode}`}
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Plane size={22} fill="currentColor" />
          </span>
          <div className="text-right">
            <p className="text-label font-semibold text-ink-soft">{flight.destination.city}</p>
            <p className="text-heading font-extrabold">{formatTime(flight.arrivesAt)}</p>
            <p className="text-small text-ink-soft">{flight.arrivalTerminal ?? flight.destination.iataCode}</p>
          </div>
        </div>

        <ul className="rounded-tile-lg bg-white/45 px-[14px] py-1">
          {departure ? (
            <Row icon={Clock} label="Embarquement" value={flight.boardingAt ? formatTime(flight.boardingAt) : '—'} />
          ) : (
            <Row icon={Luggage} label="Tapis bagages" value={flight.beltNumber ? `n° ${flight.beltNumber}` : '—'} />
          )}
          <Row icon={Globe} label="Pays" value={country} />
          <Row icon={Plane} label="Type d'avion" value={flight.aircraft?.model.name ?? '—'} />
          <Row icon={Hourglass} label="Durée du vol" value={formatDuration(flight.durationMinutes)} />
        </ul>

        <div className="flex gap-3 rounded-tile-lg bg-primary/12 p-[14px] text-body">
          <Duotone icon={Info} size={22} className="shrink-0 text-primary" />
          Veuillez vous présenter à la porte au moins 30 min avant le départ.
        </div>

        {gateLocation && (
          <button type="button" onClick={() => navigate(`/carte?location=${gateLocation.id}`)} className="btn-cta">
            Voir sur la carte
          </button>
        )}
      </GlassCard>
    </div>
  )
}

import { PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatTime } from '../lib/format'
import type { FlightSummary } from '../types'
import AirlineLogo from './AirlineLogo'
import StatusBadge from './StatusBadge'

export default function FlightRow({ flight }: { flight: FlightSummary }) {
  const departure = flight.direction === 'departure'
  const Icon = departure ? PlaneTakeoff : PlaneLanding
  const other = departure ? flight.destination : flight.origin
  return (
    <Link to={`/vols/${flight.id}`} className="frost-card flex items-center gap-3 p-3">
      <AirlineLogo airline={flight.airline} size={44} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-value font-bold">
          {flight.flightNumber}
          <Icon size={15} strokeWidth={2.25} className="text-primary" />
        </p>
        <p className="truncate text-small text-ink-soft">{flight.airline.name}</p>
        <p className="flex items-center gap-1.5 truncate text-label font-medium">
          <span className="rounded-md bg-primary/12 px-1 text-tiny font-bold text-primary">{other.iataCode}</span>
          {flight.origin.city} → {flight.destination.city}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-value font-extrabold">{formatTime(departure ? flight.departsAt : flight.arrivesAt)}</p>
        <StatusBadge status={flight.status} />
      </div>
    </Link>
  )
}

import { PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Flight } from '../data/flights'
import AirlineLogo from './AirlineLogo'
import StatusBadge from './StatusBadge'

export default function FlightRow({ flight }: { flight: Flight }) {
  const Icon = flight.direction === 'departure' ? PlaneTakeoff : PlaneLanding
  return (
    <Link to={`/vols/${flight.id}`} className="frost-card flex items-center gap-3 p-3">
      <AirlineLogo flight={flight} size={44} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-value font-bold">
          {flight.code}
          <Icon size={15} strokeWidth={2.25} className="text-primary" />
        </p>
        <p className="truncate text-small text-ink-soft">{flight.airline}</p>
        <p className="flex items-center gap-1.5 truncate text-label font-medium">
          <span className="rounded-md bg-primary/12 px-1 text-tiny font-bold text-primary">{flight.countryCode}</span>
          {flight.fromCity} → {flight.toCity}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-value font-extrabold">{flight.time}</p>
        <StatusBadge status={flight.status} />
      </div>
    </Link>
  )
}

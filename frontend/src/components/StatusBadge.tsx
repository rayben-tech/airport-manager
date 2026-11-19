import type { FlightStatus } from '../data/flights'

const styles: Record<FlightStatus, string> = {
  "À l'heure": 'bg-success-bg/[0.22] text-green-700',
  Retardé: 'bg-warning-bg/20 text-orange-700',
  Annulé: 'bg-danger/20 text-red-700',
}

/** Status pill for frosted (light) cards. */
export default function StatusBadge({ status }: { status: FlightStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-small font-bold ${styles[status]}`}>
      ● {status}
    </span>
  )
}

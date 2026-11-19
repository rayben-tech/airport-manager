import { STATUS_LABEL } from '../lib/format'
import type { FlightStatus } from '../types'

const styles: Record<FlightStatus, string> = {
  on_time: 'bg-success-bg/[0.22] text-green-700',
  boarding: 'bg-success-bg/[0.22] text-green-700',
  delayed: 'bg-warning-bg/20 text-orange-700',
  cancelled: 'bg-danger/20 text-red-700',
  departed: 'bg-ink/10 text-ink-soft',
  landed: 'bg-ink/10 text-ink-soft',
}

/** Status pill for frosted (light) cards. */
export default function StatusBadge({ status }: { status: FlightStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-small font-bold ${styles[status]}`}>
      ● {STATUS_LABEL[status]}
    </span>
  )
}

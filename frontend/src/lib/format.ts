import type { BagStatus, FlightStatus, LocalDateTime, LocalTime } from '../types'

/**
 * The API sends airport local times without a timezone ("2026-11-18T13:15:00").
 * They are read as plain text so 13:15 shows 13:15 on every machine (no Date / timezone conversion).
 */
const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

function parts(value: LocalDateTime) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value)
  if (!m) return { year: '', month: 0, day: '', time: '' }
  return { year: m[1], month: Number(m[2]), day: m[3], time: m[4] ? `${m[4]}:${m[5]}` : '' }
}

/** "13:15" */
export const formatTime = (value: LocalDateTime) => parts(value).time

/** { day: "18", month: "Nov." } */
export function formatDayMonth(value: LocalDateTime) {
  const p = parts(value)
  return { day: p.day, month: MONTHS[p.month - 1] ?? '' }
}

/** "18 Nov. 2026" */
export function formatDate(value: LocalDateTime) {
  const p = parts(value)
  return `${Number(p.day)} ${MONTHS[p.month - 1] ?? ''} ${p.year}`
}

/** "≈ 3h 05" */
export const formatDuration = (minutes: number) => `≈ ${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}`

/** "08:00 – 22:00", or "24h/24" for 00:00 – 23:59:59 */
export function formatHours(opensAt: LocalTime, closesAt: LocalTime) {
  if (opensAt.startsWith('00:00') && closesAt.startsWith('23:59')) return '24h/24'
  return `${opensAt.slice(0, 5)} – ${closesAt.startsWith('23:59') ? '00:00' : closesAt.slice(0, 5)}`
}

/** "Terminal 1" -> "1" */
export const terminalNumber = (name: string | null) => (name ? name.replace(/^Terminal\s*/i, '') : '—')

export const STATUS_LABEL: Record<FlightStatus, string> = {
  on_time: "À l'heure",
  delayed: 'Retardé',
  boarding: 'Embarquement',
  departed: 'Parti',
  landed: 'Atterri',
  cancelled: 'Annulé',
}

/** Baggage tracker: index of the current step in Enregistré / Contrôlé / Chargé / Livré. */
export const BAG_STEP: Record<BagStatus, number> = { registered: 0, screened: 1, loaded: 2, delivered: 3 }
export const BAG_STEPS = ['Enregistré', 'Contrôlé', 'Chargé', 'Livré'] as const

export const formatPrice = (mad: number) => `${new Intl.NumberFormat('fr-FR').format(mad).replace(/ | /g, ' ')} MAD`

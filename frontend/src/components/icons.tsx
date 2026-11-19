import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Duotone icons: 2px outline in currentColor, main shapes tinted with the same color at 20%. */
type IconProps = { size?: number; className?: string }

const tint = { fill: 'currentColor', fillOpacity: 0.2 }
const solid = { fill: 'currentColor', stroke: 'none' }

function Duo({ size = 30, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Any lucide icon rendered in the same duotone style (2px stroke, 20% tint fill); `plain` drops the tint. */
export function Duotone({ icon: Icon, size = 24, className, plain = false }: IconProps & { icon: LucideIcon; plain?: boolean }) {
  return (
    <Icon
      size={size}
      strokeWidth={plain ? 2.25 : 2}
      fill={plain ? 'none' : 'currentColor'}
      fillOpacity={0.2}
      className={className}
      aria-hidden
    />
  )
}

export function PlaneDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <path
        {...tint}
        d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
      />
    </Duo>
  )
}

export function PlaneTakeoffDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M2 22h20" />
      <path
        {...tint}
        d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
      />
    </Duo>
  )
}

export function PlaneLandingDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M2 22h20" />
      <path
        {...tint}
        d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z"
      />
    </Duo>
  )
}

export function BriefcaseDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <rect {...tint} x="2.5" y="7" width="19" height="14" rx="3" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2.5 13h19" />
      <path d="M10.5 12h3v2.5h-3z" {...solid} />
    </Duo>
  )
}

export function ScanQrDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <rect {...tint} x="7" y="7" width="4" height="4" rx="1" strokeWidth={1.6} />
      <rect {...tint} x="13" y="7" width="4" height="4" rx="1" strokeWidth={1.6} />
      <rect {...tint} x="7" y="13" width="4" height="4" rx="1" strokeWidth={1.6} />
      <rect {...solid} x="13" y="13" width="2" height="2" rx="0.5" />
      <rect {...solid} x="15.5" y="15.5" width="2" height="2" rx="0.5" />
    </Duo>
  )
}

export function LuggageDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <rect {...tint} x="5" y="7" width="14" height="13" rx="3" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M9.5 11v5M14.5 11v5M8 20v1.5M16 20v1.5" />
    </Duo>
  )
}

export function CalendarDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <rect {...tint} x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      {[
        [8, 14],
        [12, 14],
        [16, 14],
        [8, 17.5],
        [12, 17.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} {...solid} cx={cx} cy={cy} r="1.1" />
      ))}
    </Duo>
  )
}

export function HeadsetDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect {...tint} x="3" y="13.5" width="4.5" height="6.5" rx="2" />
      <rect {...tint} x="16.5" y="13.5" width="4.5" height="6.5" rx="2" />
      <path d="M19 20a3 3 0 0 1-3 2.5h-2.5" />
    </Duo>
  )
}

/** Solid suitcase (body filled, handle outlined), for small badges and tiles. */
export function SuitcaseSolid({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <rect x="4" y="7" width="16" height="13" rx="3" fill="currentColor" />
      <path d="M8 20v1.5M16 20v1.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

/** Map symbols where the levels connect (small line icons). */
export function ElevatorIcon(p: IconProps) {
  return (
    <Duo {...p}>
      <rect {...tint} x="4" y="3" width="16" height="18" rx="3" />
      <path d="M9 10l3-3 3 3M9 14l3 3 3-3" />
    </Duo>
  )
}

export function EscalatorIcon(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M3 19h5l8-12h5" />
      <path d="M3 15h3.5l8-12" strokeWidth={1.5} opacity={0.6} />
    </Duo>
  )
}

export function StairsIcon(p: IconProps) {
  return (
    <Duo {...p}>
      <path d="M3 20h5v-5h5v-5h5V5h3" />
    </Duo>
  )
}

export function DotsDuo(p: IconProps) {
  return (
    <Duo {...p}>
      <circle {...solid} cx="5.5" cy="12" r="2.2" />
      <circle {...solid} cx="12" cy="12" r="2.2" />
      <circle {...solid} cx="18.5" cy="12" r="2.2" />
    </Duo>
  )
}

import { memo } from 'react'
import { places } from '../data/places'

/**
 * Static schematic of the terminal on a 1000 × 1400 plan (same layout on every level).
 * Corridors follow the walkable graph in data/places.ts. Zone names, transit symbols and the
 * entrance are HTML overlays in the map page (they take part in the collision layout).
 */

const c = {
  outside: 'var(--color-map-outside)',
  floor: '#ffffff',
  wall: '#b8bfd8',
  corridor: '#f1f3fb',
  block: '#dde1f1',
  garden: '#dcefe3',
  tarmac: '#d9dce8',
  runway: '#cfd3e2',
  marking: '#f4f5fa',
  plane: '#bfc5da',
  bridge: '#e9ecf7',
  gateText: '#5b6290',
}

/** Walkable floor: two concourses with rounded tips, the grand hall, security and the landside hall. */
const floor = [
  { x: 150, y: 110, w: 140, h: 780, r: 70 },
  { x: 710, y: 110, w: 140, h: 780, r: 70 },
  { x: 150, y: 780, w: 700, h: 300, r: 56 },
  { x: 390, y: 1060, w: 220, h: 120, r: 20 },
  { x: 180, y: 1160, w: 640, h: 190, r: 44 },
]

/** Corridor centerlines (drawn as wide rounded strokes). */
const corridors = [
  'M220 170 V860 L360 940 H640 L780 860 V170',
  'M500 860 V1010 M360 940 L500 1010 L640 940',
  'M500 1010 V1320 M300 1230 H700 M500 1060 H600 M400 1060 H500',
]

/** Jet bridges come straight from the gate data, so numbers and positions always match. */
const bridges = places
  .filter((p) => p.kind === 'gate')
  .map((p) => {
    const axis = p.x < 500 ? 220 : 780 // concourse centerline
    const west = p.x < axis
    return { code: p.name.replace('Porte ', ''), x: west ? axis - 70 - 48 : axis + 70, y: p.y }
  })

/** Parked aircraft on the central apron, nose toward their gate. */
const parked = [
  { x: 386, y: 240, rot: -90 },
  { x: 386, y: 600, rot: -90 },
  { x: 614, y: 420, rot: 90 },
  { x: 614, y: 600, rot: 90 },
]
const PLANE =
  'M0 -40 C4 -40 5 -34 5 -28 L5 -8 L38 6 L38 12 L5 6 L4 26 L14 33 L14 37 L0 34 L-14 37 L-14 33 L-4 26 L-5 6 L-38 12 L-38 6 L-5 -8 L-5 -28 C-5 -34 -4 -40 0 -40 Z'

const shopYs = [330, 510]

function AirportPlan({ gateNumbers }: { gateNumbers: boolean }) {
  return (
    <svg viewBox="0 0 1000 1400" width={1000} height={1400} className="absolute inset-0 block" aria-hidden>
      <defs>
        <filter id="floor-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#3c2a8c" floodOpacity="0.14" />
        </filter>
        <filter id="block-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3c2a8c" floodOpacity="0.12" />
        </filter>
      </defs>
      <rect width="1000" height="1400" fill={c.outside} />

      {/* runway */}
      <rect x="40" y="26" width="920" height="56" rx="28" fill={c.runway} />
      <path d="M80 54 H920" stroke={c.marking} strokeWidth="3" strokeDasharray="26 18" />

      {/* aprons with taxi lines */}
      <rect x="36" y="110" width="94" height="780" rx="26" fill={c.tarmac} />
      <rect x="870" y="110" width="94" height="780" rx="26" fill={c.tarmac} />
      <rect x="318" y="110" width="364" height="560" rx="34" fill={c.tarmac} />
      <g fill="none" stroke={c.marking} strokeWidth="2.5" strokeDasharray="12 10" strokeLinecap="round">
        <path d="M83 130 V870 M917 130 V870" />
        <path d="M500 132 V648" />
        {parked.map((p) => (
          <path key={`${p.x}-${p.y}`} d={`M500 ${p.y} H${p.rot < 0 ? p.x + 44 : p.x - 44}`} />
        ))}
      </g>
      {parked.map((p) => (
        <path key={`plane-${p.x}-${p.y}`} d={PLANE} fill={c.plane} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`} />
      ))}

      {/* gardens */}
      <rect x="340" y="690" width="320" height="66" rx="33" fill={c.garden} />
      <circle cx="230" cy="1300" r="26" fill={c.garden} />
      <circle cx="770" cy="1300" r="26" fill={c.garden} />

      {/* jet bridges (gate stubs), numbers printed at high zoom */}
      {bridges.map((b) => (
        <g key={b.code}>
          <rect x={b.x} y={b.y - 12} width="48" height="24" rx="8" fill={c.bridge} stroke={c.wall} strokeWidth="2" />
          {gateNumbers && (
            <text x={b.x + 24} y={b.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={c.gateText}>
              {b.code}
            </text>
          )}
        </g>
      ))}

      {/* floor: wall + shadow pass, then a fill pass so the inner seams disappear (thin outer walls) */}
      <g filter="url(#floor-shadow)">
        {floor.map((f) => (
          <rect key={`o${f.x}-${f.y}`} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} fill={c.floor} stroke={c.wall} strokeWidth="4" />
        ))}
      </g>
      {floor.map((f) => (
        <rect key={`f${f.x}-${f.y}`} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} fill={c.floor} />
      ))}

      {/* entrance doorway in the landside wall */}
      <rect x="462" y="1342" width="76" height="12" fill={c.floor} />
      <path d="M462 1342 v14 M538 1342 v14" stroke={c.wall} strokeWidth="4" strokeLinecap="round" />

      {/* corridors */}
      <path d={corridors.join(' ')} fill="none" stroke={c.corridor} strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="300" y="872" width="400" height="140" rx="70" fill={c.corridor} />

      {/* shop / service blocks */}
      <g fill={c.block} filter="url(#block-shadow)">
        {shopYs.map((y) => (
          <g key={y}>
            <rect x="158" y={y - 34} width="26" height="68" rx="9" />
            <rect x="256" y={y - 34} width="26" height="68" rx="9" />
            <rect x="718" y={y - 34} width="26" height="68" rx="9" />
            <rect x="816" y={y - 34} width="26" height="68" rx="9" />
          </g>
        ))}
        <rect x="420" y="796" width="160" height="40" rx="14" />
        <rect x="176" y="800" width="104" height="50" rx="16" />
        <rect x="720" y="800" width="104" height="50" rx="16" />
        <rect x="176" y="1004" width="150" height="50" rx="16" />
        <rect x="674" y="1004" width="150" height="50" rx="16" />
      </g>

      {/* security lanes */}
      <g stroke={c.wall} strokeWidth="3" strokeLinecap="round">
        {[425, 460, 540, 575].map((x) => (
          <path key={x} d={`M${x} 1084 V1116`} />
        ))}
      </g>

      {/* baggage belts */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={262 + i * 88} y="1262" width="36" height="58" rx="18" fill="none" stroke={c.block} strokeWidth="10" />
      ))}

      {/* landside road */}
      <rect x="0" y="1362" width="1000" height="38" fill={c.runway} />
      <path d="M0 1394 H1000" stroke={c.marking} strokeWidth="2.5" strokeDasharray="20 16" />
    </svg>
  )
}

export default memo(AirportPlan)

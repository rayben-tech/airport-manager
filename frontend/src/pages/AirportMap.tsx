import {
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Footprints,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  Radio,
  Search,
  Share2,
  X,
} from 'lucide-react'
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import AirlineLogo from '../components/AirlineLogo'
import AirportPlan from '../components/AirportPlan'
import PlaceIcon from '../components/PlaceIcon'
import StatusBadge from '../components/StatusBadge'
import { ElevatorIcon, EscalatorIcon, StairsIcon } from '../components/icons'
import { kindStyle, placeTile } from '../components/placeStyle'
import { flights } from '../data/flights'
import {
  ELEVATOR_NODE,
  LEVELS,
  type Level,
  type Place,
  USER_LEVEL,
  USER_NODE,
  getPlace,
  graphEdges,
  graphNodes,
  levelLabel,
  places,
} from '../data/places'
import { type Point, nearestNode, pathLength, shortestPath } from '../lib/route'

// ---- layout constants (px in the 390 × 844 frame) ----
const PLAN_W = 1000
const PLAN_H = 1400
const CHIPS_BOTTOM = 120 // 24 top + 52 search + 8 gap + 36 chips
const TOP_BAND = CHIPS_BOTTOM + 16 // the plan is never fitted under the search area
const RIGHT_RAIL = 76 // 16 margin + 48 controls + 12 gap
const NAV_CLEAR = 102 // navbar + its raised center button, from the frame bottom
const FIT_BOTTOM = NAV_CLEAR + 16
const SHEET_BOTTOM = 110 // sheet sits 8px above the raised navbar button
const CONTROLS_BOTTOM = 80 + 12 // zoom pill: 12px above the navbar when no sheet is open
const GAP = 12
const PEEK = 210
const MIN_ZOOM = 0.8 // relative to the initial "whole plan" fit
const MAX_ZOOM = 4
const FULL_ZOOM = 2 // pins reach 30px, gates show the plane icon, labels appear
const GATE_NUMBERS_ZOOM = 2.6 // gate numbers printed on the jet bridges
const METERS_PER_UNIT = 0.4
const WALK_SPEED = 1.3 // m/s
const SAVED_KEY = 'cmn.savedPlaces'

const filters = [
  { key: 'all', label: 'Tout' },
  { key: 'gate', label: 'Gates' },
  { key: 'shop', label: 'Commerces' },
  { key: 'service', label: 'Services' },
] as const
type FilterKey = (typeof filters)[number]['key']

const matchesFilter = (p: Place, f: FilterKey) =>
  f === 'all' ||
  (f === 'gate' && p.kind === 'gate') ||
  (f === 'shop' && (p.kind === 'restaurant' || p.kind === 'boutique')) ||
  (f === 'service' && p.kind === 'service')

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Zone names drawn over the plan (9px caps), shown only where they don't collide. */
const zones = [
  { id: 'jetee-a', label: 'Jetée A', x: 220, y: 152 },
  { id: 'jetee-b', label: 'Jetée B', x: 780, y: 152 },
  { id: 'apron', label: 'Aire de trafic', x: 500, y: 178 },
  { id: 'hall', label: 'Grand hall', x: 500, y: 905 },
  { id: 'surete', label: 'Zone de sûreté', x: 500, y: 1162 },
  { id: 'enregistrement', label: 'Enregistrement', x: 330, y: 1338 },
  { id: 'arrivees', label: 'Arrivées', x: 670, y: 1338 },
]

/** Where the levels connect (same position on every level). */
const transit = [
  { id: 'ascenseur', label: 'Ascenseur', x: 600, y: 1060, icon: ElevatorIcon },
  { id: 'escalator', label: 'Escalator', x: 400, y: 1060, icon: EscalatorIcon },
  { id: 'escaliers-o', label: 'Escaliers', x: 250, y: 950, icon: StairsIcon },
  { id: 'escaliers-e', label: 'Escaliers', x: 750, y: 950, icon: StairsIcon },
]
const ENTRANCE = { x: 500, y: 1381 }

type View = { x: number; y: number; s: number }
type SheetState = 'peek' | 'expanded'
type PinMode = 'full' | 'mini' | 'hidden'
interface Route {
  points: Point[]
  meters: number
  minutes: number
  elevatorTo: Level | null
}

type Gesture =
  | { mode: 'pan'; startX: number; startY: number; base: View; moved: boolean; pinId: string | null }
  | { mode: 'pinch'; d0: number; mid0: Point; base: View }

function loadSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    const ids: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/** Keep the plan covering the visible band (or inside it when it is smaller). */
function clampAxis(t: number, content: number, lo: number, hi: number) {
  return content >= hi - lo ? Math.min(lo, Math.max(hi - content, t)) : Math.min(hi - content, Math.max(lo, t))
}

// ---------------------------------------------------------------- collision layout

/** Pin diameter on screen: 20px at the initial fit, growing to 30px at 2×. */
const pinPx = (z: number) => Math.min(30, Math.max(20, 20 + (z - 1) * 10))
const labelWidth = (name: string) => name.length * 6.4 + 8
const zoneWidth = (label: string) => label.length * 6.3 + 6
const userBubbleText = (level: Level) => `Vous êtes ici${level !== USER_LEVEL ? ` (N${USER_LEVEL})` : ''}`
const priority = (p: Place) => (p.kind === 'gate' ? 3 : p.kind === 'service' ? 1 : 2)

type Shape = { kind: 'circle'; x: number; y: number; r: number } | { kind: 'rect'; x: number; y: number; hw: number; hh: number }
const circle = (x: number, y: number, r: number): Shape => ({ kind: 'circle', x, y, r })
const box = (x: number, y: number, hw: number, hh: number): Shape => ({ kind: 'rect', x, y, hw, hh })

function hits(a: Shape, b: Shape, pad = 2): boolean {
  if (a.kind === 'circle' && b.kind === 'circle') return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + pad
  if (a.kind === 'rect' && b.kind === 'rect') return Math.abs(a.x - b.x) < a.hw + b.hw + pad && Math.abs(a.y - b.y) < a.hh + b.hh + pad
  const c = a.kind === 'circle' ? a : (b as Extract<Shape, { kind: 'circle' }>)
  const r = a.kind === 'rect' ? a : (b as Extract<Shape, { kind: 'rect' }>)
  const dx = Math.max(Math.abs(c.x - r.x) - r.hw, 0)
  const dy = Math.max(Math.abs(c.y - r.y) - r.hh, 0)
  return Math.hypot(dx, dy) < c.r + pad
}

interface MapLayout {
  modes: Map<string, PinMode>
  labels: Set<string>
  zones: Set<string>
}

/**
 * Decides, for the current zoom, which pins are full markers, small dots or hidden, and which
 * pin labels and zone labels can be shown, so nothing ever overlaps. Positions are screen px
 * relative to the plan origin (the pan offset doesn't matter).
 */
function layoutMap(visible: Place[], s: number, z: number, selectedId: string | null, forced: Set<string>, level: Level, user: Point | undefined): MapLayout {
  const placed: Shape[] = []
  const labelShapes: Shape[] = []
  const modes = new Map<string, PinMode>()
  const labels = new Set<string>()
  const clear = (sh: Shape, pad = 2) => !placed.some((o) => hits(sh, o, pad)) && !labelShapes.some((o) => hits(sh, o, pad))

  // fixed markers first: "Vous êtes ici" (dot + bubble above), transit symbols, entrance
  if (user) {
    placed.push(circle(user.x * s, user.y * s, 11))
    placed.push(box(user.x * s, user.y * s - 24, (userBubbleText(level).length * 5.6 + 18) / 2, 11))
  }
  for (const t of transit) placed.push(circle(t.x * s, t.y * s, 11))
  placed.push(box(ENTRANCE.x * s, ENTRANCE.y * s, 30, 8))

  const sel = visible.find((p) => p.id === selectedId)
  if (sel) {
    modes.set(sel.id, 'full')
    placed.push(circle(sel.x * s, sel.y * s - 28, 26))
    const w = labelWidth(sel.name) + 14
    labelShapes.push(box(sel.x * s + 30 + w / 2, sel.y * s - 28, w / 2, 10))
    labels.add(sel.id)
  }

  const r = pinPx(z) / 2
  // search results claim their pin and label space right after the selection; neighbours yield to them
  const order = visible
    .filter((p) => p.id !== selectedId)
    .sort((a, b) => Number(forced.has(b.id)) - Number(forced.has(a.id)) || priority(b) - priority(a) || a.id.localeCompare(b.id))
  for (const p of order) {
    if (!forced.has(p.id)) continue
    const w = labelWidth(p.name)
    modes.set(p.id, 'full')
    placed.push(circle(p.x * s, p.y * s, r))
    labelShapes.push(box(p.x * s + r + 6 + w / 2, p.y * s, w / 2, 8))
    labels.add(p.id)
  }
  for (const p of order) {
    if (forced.has(p.id)) continue
    // a pin must stay clear of other pins, fixed markers and the labels already reserved
    if (clear(circle(p.x * s, p.y * s, r))) {
      modes.set(p.id, 'full')
      placed.push(circle(p.x * s, p.y * s, r))
    } else if (clear(circle(p.x * s, p.y * s, 4), 1)) {
      modes.set(p.id, 'mini')
      placed.push(circle(p.x * s, p.y * s, 4))
    } else {
      modes.set(p.id, 'hidden')
    }
  }

  for (const p of order) {
    if (forced.has(p.id) || modes.get(p.id) !== 'full' || z < FULL_ZOOM) continue
    const w = labelWidth(p.name)
    const lab = box(p.x * s + r + 6 + w / 2, p.y * s, w / 2, 8)
    if (clear(lab)) {
      labels.add(p.id)
      labelShapes.push(lab)
    }
  }

  const shown = new Set<string>()
  for (const zn of zones) {
    const lab = box(zn.x * s, zn.y * s, zoneWidth(zn.label) / 2, 7)
    if (clear(lab, 3)) {
      shown.add(zn.id)
      labelShapes.push(lab)
    }
  }
  return { modes, labels, zones: shown }
}

// ---------------------------------------------------------------- pins

function Pin({ place, mode, selected, gateText }: { place: Place; mode: PinMode; selected: boolean; gateText: boolean }) {
  const style = kindStyle[place.kind]
  const common = { 'data-pin': place.id, 'aria-label': place.name, type: 'button' as const }

  if (selected) {
    return (
      <button
        {...common}
        className="map-pin absolute flex"
        style={{ left: place.x, top: place.y, zIndex: 30, transformOrigin: '50% 100%', transform: 'translate(-50%, -100%) scale(var(--inv))' }}
      >
        <span className="relative flex flex-col items-center">
          <span className="absolute top-0 h-11 w-11 animate-ping rounded-full bg-primary/35" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-white shadow-nav-glow ring-4 ring-white">
            <PlaceIcon place={place} size={20} solid />
          </span>
          <span className="-mt-2 h-3 w-3 rotate-45 rounded-[3px] bg-nav-to ring-2 ring-white" />
        </span>
      </button>
    )
  }
  if (mode === 'mini') {
    return (
      <button
        {...common}
        className={`map-pin absolute h-2 w-2 rounded-full border-[1.5px] border-white shadow-sm ${style.pin}`}
        style={{ left: place.x, top: place.y, zIndex: 1, transform: 'translate(-50%, -50%) scale(var(--inv))' }}
      />
    )
  }
  // full marker: 30px element scaled to 20–30px on screen by --pk
  return (
    <button
      {...common}
      className={`map-pin absolute flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white text-white shadow-md ${style.pin}`}
      style={{ left: place.x, top: place.y, zIndex: 2, transform: 'translate(-50%, -50%) scale(calc(var(--inv) * var(--pk)))' }}
    >
      {place.kind === 'gate' && gateText ? (
        <span className="text-[12px] font-extrabold leading-none tracking-tight">{place.name.replace('Porte ', '')}</span>
      ) : (
        <PlaceIcon place={place} size={15} solid />
      )}
    </button>
  )
}

function PinLabel({ place, selected }: { place: Place; selected: boolean }) {
  return (
    <span
      className={`map-label map-pin pointer-events-none absolute whitespace-nowrap font-bold ${selected ? 'text-body text-ink' : `text-[11px] ${kindStyle[place.kind].label}`}`}
      style={{
        left: place.x,
        top: place.y,
        zIndex: selected ? 31 : 3,
        transformOrigin: '0 50%',
        transform: selected
          ? 'translateY(-50%) scale(var(--inv)) translate(30px, -28px)'
          : 'translateY(-50%) scale(var(--inv)) translateX(calc(var(--pk) * 15px + 6px))',
      }}
    >
      {place.name}
    </span>
  )
}

// ---------------------------------------------------------------- sheet

function GateFlights({ code }: { code: string }) {
  const list = flights.filter((f) => f.gate === code).sort((a, b) => a.time.localeCompare(b.time))
  return (
    <div className="mt-4 rounded-tile-lg border border-white/80 bg-white/60 p-3">
      <p className="flex items-center gap-2 text-label font-bold">
        <Radio size={16} className="text-green-600" /> Prochains vols
      </p>
      {list.length === 0 && <p className="mt-2 text-small text-ink-soft">Aucun vol prévu à cette porte aujourd’hui.</p>}
      <ul className="mt-1 divide-y divide-ink/8">
        {list.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-2.5">
            <AirlineLogo flight={f} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-bold">{f.code}</p>
              <p className="truncate text-small text-ink-soft">{f.direction === 'departure' ? `vers ${f.toCity}` : `de ${f.fromCity}`}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={f.status} />
              <span className="text-label font-bold">{f.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlaceInfo({ place }: { place: Place }) {
  return (
    <div className="mt-4 space-y-2 rounded-tile-lg border border-white/80 bg-white/60 p-3 text-body">
      <p className="flex items-center gap-2 font-bold">
        <span className={`h-2.5 w-2.5 rounded-full ${kindStyle[place.kind].pin}`} />
        {kindStyle[place.kind].name}
      </p>
      {place.hours && (
        <p className="flex items-center gap-2 text-ink-soft">
          <Clock size={16} className="text-primary" /> {place.hours}
        </p>
      )}
      {place.description && <p className="text-ink-soft">{place.description}</p>}
    </div>
  )
}

// ---------------------------------------------------------------- page

export default function AirportMap() {
  const [params] = useSearchParams()
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const view = useRef<View>({ x: 0, y: 0, s: 1 })
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const animTimer = useRef<number | undefined>(undefined)
  const sheetDrag = useRef<number | null>(null)
  const lastLocateTap = useRef(0)

  // deep link from a flight or a list: /carte?place=gate-B12
  const [initialPlace] = useState(() => getPlace(params.get('place') ?? ''))

  const [size, setSize] = useState({ w: 0, h: 0 })
  const [level, setLevel] = useState<Level>(initialPlace?.level ?? USER_LEVEL)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialPlace?.id ?? null)
  const [sheet, setSheet] = useState<SheetState>('peek')
  const [route, setRoute] = useState<Route | null>(null)
  const [zoomRel, setZoomRel] = useState(1) // zoom relative to the whole-plan fit, in 0.1 steps (pans don't re-render)
  const [chipsFade, setChipsFade] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(loadSaved)
  const [toast, setToast] = useState('')

  const selected = selectedId ? getPlace(selectedId) : undefined
  const sheetH = selected ? (sheet === 'expanded' ? Math.round(size.h * 0.55) : PEEK) : 0
  const bandBottom = (h: number, sh: number) => (sh ? h - SHEET_BOTTOM - sh - 8 : h - FIT_BOTTOM)

  // latest layout values for the imperative handlers (synced before effects and events run)
  const layout = useRef({ w: 0, h: 0, sheetH: 0 })
  useLayoutEffect(() => {
    layout.current = { w: size.w, h: size.h, sheetH }
  })

  /** The whole plan, centered in the free area: below the chips, above the navbar, left of the controls. */
  const fitAllView = (): View => {
    const { w, h } = layout.current
    const areaW = w - RIGHT_RAIL - 16
    const areaH = h - FIT_BOTTOM - TOP_BAND
    const s = Math.min(areaW / PLAN_W, areaH / PLAN_H)
    return { s, x: 16 + (areaW - PLAN_W * s) / 2, y: TOP_BAND + (areaH - PLAN_H * s) / 2 }
  }
  const fitScale = () => fitAllView().s

  const clampView = useCallback((v: View, sh = layout.current.sheetH): View => {
    const { w, h } = layout.current
    const fit = fitScale()
    const s = Math.min(fit * MAX_ZOOM, Math.max(fit * MIN_ZOOM, v.s))
    return {
      s,
      // the plan may slide under the right rail so pins near the east edge can reach the free area
      x: clampAxis(v.x, PLAN_W * s, 0, w - RIGHT_RAIL),
      y: clampAxis(v.y, PLAN_H * s, TOP_BAND, bandBottom(h, sh)),
    }
  }, [])

  const apply = useCallback((v: View, animate = false) => {
    view.current = v
    const layer = layerRef.current
    const root = rootRef.current
    if (!layer || !root) return
    const z = v.s / fitScale()
    layer.style.transition = animate ? 'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
    layer.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`
    layer.style.setProperty('--inv', String(1 / v.s))
    layer.style.setProperty('--pk', String(pinPx(z) / 30)) // pins grow smoothly with the zoom
    window.clearTimeout(animTimer.current)
    if (animate) {
      root.classList.add('map-animating')
      animTimer.current = window.setTimeout(() => root.classList.remove('map-animating'), 400)
    } else {
      root.classList.remove('map-animating')
    }
    setZoomRel(Math.round(z * 10) / 10)
  }, [])

  const zoomAt = useCallback(
    (px: number, py: number, factor: number, animate: boolean) => {
      const v = view.current
      const fit = fitScale()
      const s = Math.min(fit * MAX_ZOOM, Math.max(fit * MIN_ZOOM, v.s * factor))
      const k = s / v.s
      apply(clampView({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k }), animate)
    },
    [apply, clampView],
  )

  /** Center a map point in the visible band (between the top UI, the controls and the sheet). */
  const flyTo = useCallback(
    (p: Point, minZoom: number, sh: number) => {
      const { w, h } = layout.current
      const s = Math.max(view.current.s, fitScale() * minZoom)
      const cy = (TOP_BAND + bandBottom(h, sh)) / 2
      const cx = (w - RIGHT_RAIL) / 2 // left of the rail, leaving room for the label on the right
      apply(clampView({ s, x: cx - p.x * s, y: cy - p.y * s }, sh), true)
    },
    [apply, clampView],
  )

  const fitPoints = useCallback(
    (pts: Point[], sh: number) => {
      const { w, h } = layout.current
      const pad = 70
      const minX = Math.min(...pts.map((p) => p.x)) - pad
      const maxX = Math.max(...pts.map((p) => p.x)) + pad + 90 // room for the selected label on the right
      const minY = Math.min(...pts.map((p) => p.y)) - pad - 60 // room for the selected marker above its point
      const maxY = Math.max(...pts.map((p) => p.y)) + pad
      const bandH = bandBottom(h, sh) - TOP_BAND
      const bandW = w - RIGHT_RAIL
      const s = Math.min(bandW / (maxX - minX), bandH / (maxY - minY), fitScale() * MAX_ZOOM)
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      apply(clampView({ s, x: bandW / 2 - cx * s, y: TOP_BAND + bandH / 2 - cy * s }, sh), true)
    },
    [apply, clampView],
  )

  // ---- selection ----
  const select = useCallback(
    (id: string) => {
      const p = getPlace(id)
      if (!p) return
      setSelectedId(id)
      setSheet('peek')
      setRoute(null)
      setQuery('') // selecting a place (pin or search result) closes the search dropdown
      flyTo(p, FULL_ZOOM, PEEK)
    },
    [flyTo],
  )
  const deselect = useCallback(() => {
    setSelectedId(null)
    setRoute(null)
  }, [])

  const changeLevel = (l: Level) => {
    setLevel(l)
    if (selected && selected.level !== l) deselect()
  }

  // ---- size + initial view ----
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const initialized = useRef(false)
  useLayoutEffect(() => {
    if (!size.w) return
    if (initialized.current) {
      apply(clampView(view.current))
      return
    }
    initialized.current = true
    apply(clampView(fitAllView(), 0))
    if (initialPlace) flyTo(initialPlace, FULL_ZOOM, PEEK)
  }, [size, apply, clampView, flyTo, initialPlace])

  // re-clamp when the sheet opens, grows or closes
  useEffect(() => {
    if (size.w) apply(clampView(view.current), true)
  }, [sheetH, size.w, apply, clampView])

  // wheel zoom around the cursor (non-passive so the frame never scrolls)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015), false)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // soft fade on the right of the chips row, only when it can scroll further
  useEffect(() => {
    const el = chipsRef.current
    if (!el) return
    const update = () => setChipsFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 4)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener('scroll', update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [])

  // ---- pointer gestures: pan, pinch, tap ----
  const local = (e: ReactPointerEvent): Point => {
    const r = viewportRef.current?.getBoundingClientRect()
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) }
  }

  const startGesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = {
        mode: 'pinch',
        d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        base: view.current,
      }
    } else if (pts.length === 1) {
      gesture.current = { mode: 'pan', startX: pts[0].x, startY: pts[0].y, base: view.current, moved: true, pinId: null }
    } else {
      gesture.current = null
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, local(e))
    if (pointers.current.size === 1) {
      const pin = (e.target as Element).closest('[data-pin]')
      const p = local(e)
      gesture.current = { mode: 'pan', startX: p.x, startY: p.y, base: view.current, moved: false, pinId: pin?.getAttribute('data-pin') ?? null }
    } else {
      startGesture()
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, local(e))
    const g = gesture.current
    if (!g) return
    if (g.mode === 'pan') {
      const p = local(e)
      const dx = p.x - g.startX
      const dy = p.y - g.startY
      if (!g.moved && Math.hypot(dx, dy) < 5) return
      g.moved = true
      apply(clampView({ ...g.base, x: g.base.x + dx, y: g.base.y + dy }))
    } else {
      const [a, b] = [...pointers.current.values()]
      if (!a || !b) return
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const fit = fitScale()
      const s = Math.min(fit * MAX_ZOOM, Math.max(fit * MIN_ZOOM, g.base.s * (d / g.d0)))
      const k = s / g.base.s
      apply(clampView({ s, x: mid.x - (g.mid0.x - g.base.x) * k, y: mid.y - (g.mid0.y - g.base.y) * k }))
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    pointers.current.delete(e.pointerId)
    if (g?.mode === 'pan' && !g.moved && pointers.current.size === 0) {
      if (g.pinId) select(g.pinId)
      else deselect()
    }
    startGesture()
  }

  const onDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('[data-pin]')) return
    const r = e.currentTarget.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, 1.8, true)
  }

  // ---- route ----
  const startRoute = () => {
    if (!selected) return
    const goal = nearestNode(graphNodes, selected)
    const cross = selected.level !== USER_LEVEL
    const legs = cross
      ? [shortestPath(graphNodes, graphEdges, USER_NODE, ELEVATOR_NODE), shortestPath(graphNodes, graphEdges, ELEVATOR_NODE, goal.id)]
      : [shortestPath(graphNodes, graphEdges, USER_NODE, goal.id)]
    const nodes = legs.flatMap((leg, i) => (leg ? (i ? leg.slice(1) : leg) : []))
    const points: Point[] = [...nodes, { x: selected.x, y: selected.y }].filter(
      (p, i, all) => i === 0 || p.x !== all[i - 1].x || p.y !== all[i - 1].y,
    )
    const meters = Math.round((pathLength(points) * METERS_PER_UNIT) / 10) * 10
    setRoute({
      points,
      meters,
      minutes: Math.max(1, Math.round(meters / WALK_SPEED / 60)),
      elevatorTo: cross ? selected.level : null,
    })
    fitPoints(points, sheetH)
  }

  // ---- save / share ----
  const toggleSaved = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]))
      } catch {
        /* storage unavailable: keep the in-memory state */
      }
      return next
    })
  }

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 1800)
  }

  const share = async (p: Place) => {
    const url = `${window.location.origin}/carte?place=${p.id}`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: p.name, url })
      else {
        await navigator.clipboard.writeText(url)
        showToast('Lien copié')
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  // ---- derived lists ----
  const q = normalize(query.trim())
  const results = useMemo(() => (q ? places.filter((p) => normalize(p.name).includes(q)).slice(0, 5) : []), [q])
  const resultIds = useMemo(() => new Set(results.map((r) => r.id)), [results])
  const visible = useMemo(
    () => places.filter((p) => p.level === level && (matchesFilter(p, filter) || p.id === selectedId)),
    [level, filter, selectedId],
  )
  const userNode = graphNodes.find((n) => n.id === USER_NODE)
  const elevatorNode = graphNodes.find((n) => n.id === ELEVATOR_NODE)

  const fitS = size.w ? Math.min((size.w - RIGHT_RAIL - 16) / PLAN_W, (size.h - FIT_BOTTOM - TOP_BAND) / PLAN_H) : 0
  const mapLayout = useMemo(
    () => layoutMap(visible, zoomRel * fitS, zoomRel, selectedId, resultIds, level, userNode),
    [visible, zoomRel, fitS, selectedId, resultIds, level, userNode],
  )

  const chooseResult = (p: Place) => {
    setQuery('')
    ;(document.activeElement as HTMLElement | null)?.blur()
    setLevel(p.level)
    select(p.id)
  }

  const locate = () => {
    const now = Date.now()
    // double tap without a route: back to the whole-plan view
    if (now - lastLocateTap.current < 400 && !route) {
      lastLocateTap.current = 0
      apply(clampView(fitAllView()), true)
      return
    }
    lastLocateTap.current = now
    if (userNode) {
      changeLevel(USER_LEVEL)
      flyTo(userNode, 2.2, sheetH)
    }
  }

  // sheet handle: a tap toggles (onClick, also works with the keyboard); a vertical drag expands, collapses or closes
  const sheetDragged = useRef(false)
  const onSheetHandleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    sheetDrag.current = e.clientY
    sheetDragged.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onSheetHandleUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetDrag.current === null) return
    const dy = e.clientY - sheetDrag.current
    sheetDrag.current = null
    if (Math.abs(dy) < 30) return
    sheetDragged.current = true
    if (dy < 0) setSheet('expanded')
    else if (sheet === 'expanded') setSheet('peek')
    else deselect()
  }
  const onSheetHandleClick = () => {
    if (sheetDragged.current) {
      sheetDragged.current = false
      return
    }
    setSheet((s) => (s === 'peek' ? 'expanded' : 'peek'))
  }

  const expanded = !!selected && sheet === 'expanded'
  const controlsBottom = sheetH ? SHEET_BOTTOM + sheetH + GAP : CONTROLS_BOTTOM
  const isSaved = selected ? saved.has(selected.id) : false
  const counterScale = 'translate(-50%, -50%) scale(var(--inv))'

  return (
    // -bottom-4: the frame's scroll area stops 16px above the frame edge; the map fills the whole frame
    <div ref={rootRef} className="absolute inset-x-0 top-0 -bottom-4 select-none overflow-hidden bg-map-outside">
      {/* ---------- map viewport ---------- */}
      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div ref={layerRef} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: PLAN_W, height: PLAN_H }}>
          <AirportPlan gateNumbers={zoomRel >= GATE_NUMBERS_ZOOM} />

          {/* zone names */}
          {zones
            .filter((zn) => mapLayout.zones.has(zn.id))
            .map((zn) => (
              <span
                key={zn.id}
                className="map-label map-pin pointer-events-none absolute whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-map-text"
                style={{ left: zn.x, top: zn.y, transform: counterScale }}
              >
                {zn.label}
              </span>
            ))}

          {/* elevator, escalator, stairs */}
          {transit.map((t) => (
            <span
              key={t.id}
              title={t.label}
              className="map-pin pointer-events-none absolute flex h-5 w-5 items-center justify-center rounded-md border border-map-line bg-white text-ink-soft shadow-sm"
              style={{ left: t.x, top: t.y, transform: counterScale, zIndex: 4 }}
            >
              <t.icon size={13} />
            </span>
          ))}

          {/* main entrance */}
          <span
            className="map-label map-pin pointer-events-none absolute flex items-center gap-0.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-map-text"
            style={{ left: ENTRANCE.x, top: ENTRANCE.y, transform: counterScale }}
          >
            <ArrowUp size={11} strokeWidth={3} /> Entrée
          </span>

          {route && (
            <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} width={PLAN_W} height={PLAN_H} className="pointer-events-none absolute inset-0" aria-hidden>
              {(['route-casing', 'route-line', 'route-flow'] as const).map((cls) => (
                <polyline
                  key={cls}
                  className={cls}
                  points={route.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={cls === 'route-casing' ? '#fff' : cls === 'route-line' ? 'var(--color-primary)' : 'rgba(255,255,255,0.95)'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          )}

          {route?.elevatorTo != null && elevatorNode && (
            <span
              className="map-pin absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md"
              style={{ left: elevatorNode.x, top: elevatorNode.y, transform: counterScale, zIndex: 25 }}
            >
              <ArrowUpDown size={16} strokeWidth={2.5} />
            </span>
          )}

          {/* "Vous êtes ici": blue dot with a frosted bubble above it */}
          {userNode && (
            <>
              <span className="map-pin pointer-events-none absolute flex h-[18px] w-[18px] items-center justify-center" style={{ left: userNode.x, top: userNode.y, transform: counterScale, zIndex: 20 }}>
                <span className="absolute h-full w-full animate-ping rounded-full bg-pin-gate/40" />
                <span className="relative h-[18px] w-[18px] rounded-full border-[3px] border-white bg-pin-gate shadow-md" />
              </span>
              <span
                className="map-pin pointer-events-none absolute"
                style={{ left: userNode.x, top: userNode.y, zIndex: 21, transformOrigin: '50% 100%', transform: 'translate(-50%, -100%) scale(var(--inv)) translateY(-15px)' }}
              >
                <span className="relative block whitespace-nowrap rounded-full border border-white bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pin-gate shadow-md backdrop-blur-md">
                  {userBubbleText(level)}
                </span>
                <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-white bg-white/90" />
              </span>
            </>
          )}

          {visible.map((p) => {
            const mode = mapLayout.modes.get(p.id) ?? 'hidden'
            const isSel = p.id === selectedId
            if (mode === 'hidden' && !isSel) return null
            return <Pin key={p.id} place={p} mode={mode} selected={isSel} gateText={zoomRel < FULL_ZOOM} />
          })}
          {visible
            .filter((p) => mapLayout.labels.has(p.id))
            .map((p) => (
              <PinLabel key={`label-${p.id}`} place={p} selected={p.id === selectedId} />
            ))}
        </div>
      </div>

      {/* soft white fade so the search and chips always read cleanly over the map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-white/95 via-white/70 to-transparent" style={{ height: CHIPS_BOTTOM + 24 }} />

      {/* ---------- search + chips ---------- */}
      <div className="absolute inset-x-4 top-6 z-30">
        <label className="glass-light flex h-[52px] items-center gap-3 rounded-full bg-white/80 px-5 text-ink">
          <Search size={20} className="shrink-0 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && results[0] && chooseResult(results[0])}
            placeholder="Rechercher un lieu, une porte..."
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-soft"
          />
          {query && (
            <button type="button" aria-label="Effacer" onClick={() => setQuery('')} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/8">
              <X size={16} />
            </button>
          )}
        </label>

        {results.length > 0 && (
          <ul className="glass-light mt-2 overflow-hidden rounded-tile-lg bg-white/90 text-ink">
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => chooseResult(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/8">
                  <span className={`${placeTile} h-9 w-9`}>
                    <PlaceIcon place={p} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-bold">{p.name}</span>
                    <span className="block text-small text-ink-soft">
                      {p.terminal} • {levelLabel(p.level)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q && results.length === 0 && (
          <p className="glass-light mt-2 rounded-tile-lg bg-white/90 px-4 py-3 text-body text-ink-soft">Aucun lieu trouvé.</p>
        )}

        {/* chips stay mounted (hidden while searching) so the fade observer keeps working */}
        <div
          ref={chipsRef}
          className={`no-scrollbar mt-2 flex gap-2 overflow-x-auto ${q ? 'hidden' : ''}`}
          style={chipsFade ? { maskImage: 'linear-gradient(to right, #000 82%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 82%, transparent)' } : undefined}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`h-9 shrink-0 rounded-full px-3.5 text-label font-semibold ${
                filter === f.key
                  ? 'bg-linear-to-r from-btn-from to-nav-to text-white shadow-nav-glow'
                  : 'border border-white/90 bg-white/80 text-ink shadow-sm backdrop-blur-md'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- level selector (12px under the chips) ---------- */}
      {!expanded && (
        <div className="glass-light absolute right-4 z-20 flex w-12 flex-col items-center rounded-full bg-white/80 py-1 text-ink" style={{ top: CHIPS_BOTTOM + GAP }}>
          <button type="button" aria-label="Niveau supérieur" onClick={() => level < 2 && changeLevel((level + 1) as Level)} className="flex h-8 w-full items-center justify-center disabled:opacity-30" disabled={level === 2}>
            <ChevronUp size={18} strokeWidth={2.5} />
          </button>
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLevel(l)}
              aria-pressed={l === level}
              className={`my-0.5 flex h-9 w-9 items-center justify-center rounded-full text-label font-bold ${
                l === level ? 'bg-linear-to-br from-btn-from to-nav-to text-white shadow-nav-glow' : 'text-ink'
              }`}
            >
              N{l}
            </button>
          ))}
          <button type="button" aria-label="Niveau inférieur" onClick={() => level > 0 && changeLevel((level - 1) as Level)} className="flex h-8 w-full items-center justify-center disabled:opacity-30" disabled={level === 0}>
            <ChevronDown size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ---------- zoom + locate (12px above the navbar or the sheet) ---------- */}
      {!expanded && (
        <div
          className="glass-light absolute right-4 z-20 flex w-12 flex-col items-center rounded-full bg-white/80 py-1 text-ink transition-[bottom] duration-300"
          style={{ bottom: controlsBottom }}
        >
          <button type="button" aria-label="Zoom avant" className="flex h-10 w-10 items-center justify-center" onClick={() => zoomAt((size.w - RIGHT_RAIL) / 2, (TOP_BAND + bandBottom(size.h, sheetH)) / 2, 1.5, true)}>
            <Plus size={20} strokeWidth={2.5} />
          </button>
          <button type="button" aria-label="Zoom arrière" className="flex h-10 w-10 items-center justify-center" onClick={() => zoomAt((size.w - RIGHT_RAIL) / 2, (TOP_BAND + bandBottom(size.h, sheetH)) / 2, 1 / 1.5, true)}>
            <Minus size={20} strokeWidth={2.5} />
          </button>
          <button type="button" aria-label="Ma position (double tap : tout le plan)" className="flex h-10 w-10 items-center justify-center text-primary" onClick={locate}>
            <LocateFixed size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ---------- bottom sheet ---------- */}
      {selected && (
        <section
          className="glass-light absolute inset-x-4 z-20 flex flex-col rounded-panel bg-white/88 text-ink transition-[height] duration-300 [--glass-light-bg:rgba(255,255,255,0.88)]"
          style={{ bottom: SHEET_BOTTOM, height: sheetH }}
          aria-label={selected.name}
        >
          <button
            type="button"
            aria-label={sheet === 'peek' ? 'Agrandir' : 'Réduire'}
            onPointerDown={onSheetHandleDown}
            onPointerUp={onSheetHandleUp}
            onClick={onSheetHandleClick}
            className="flex h-6 w-full shrink-0 touch-none items-center justify-center"
          >
            <span className="h-1.5 w-10 rounded-full bg-ink/20" />
          </button>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-dest font-extrabold leading-tight">{selected.name}</h2>
                <p className="text-label text-ink-soft">
                  {levelLabel(selected.level)}, {selected.terminal}
                </p>
              </div>
              <button type="button" aria-label="Partager" onClick={() => share(selected)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/8">
                <Share2 size={17} />
              </button>
              <button type="button" aria-label="Fermer" onClick={deselect} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/8">
                <X size={18} />
              </button>
            </div>

            {route ? (
              <div className="mt-3">
                <p className="flex items-center gap-2 text-strong font-bold">
                  <Footprints size={18} className="text-primary" />À pied • {route.minutes} min • {route.meters} m
                </p>
                {route.elevatorTo !== null && (
                  <p className="mt-1.5 flex items-center gap-2 rounded-chip bg-primary/10 px-3 py-2 text-label font-semibold">
                    <ArrowUpDown size={16} className="text-primary" /> Prenez l’ascenseur jusqu’au niveau {route.elevatorTo}
                  </p>
                )}
                <button type="button" onClick={() => setRoute(null)} className="mt-3 h-12 w-full rounded-full bg-linear-to-r from-btn-from to-btn-mid text-body font-bold text-white shadow-search">
                  Arrêter
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={startRoute}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r from-btn-from to-btn-mid text-body font-bold text-white shadow-search"
                >
                  <Navigation size={18} fill="currentColor" /> Itinéraire
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaved(selected.id)}
                  aria-pressed={isSaved}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/90 bg-white/70 text-body font-bold text-btn-from shadow-sm"
                >
                  {isSaved ? <BookmarkCheck size={18} fill="currentColor" fillOpacity={0.25} /> : <Bookmark size={18} />}
                  {isSaved ? 'Enregistré' : 'Enregistrer'}
                </button>
              </div>
            )}

            {selected.kind === 'gate' ? <GateFlights code={selected.name.replace('Porte ', '')} /> : <PlaceInfo place={selected} />}
          </div>
        </section>
      )}

      {toast && (
        <p className="glass-light absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-2 text-small font-semibold text-white [--glass-light-bg:rgba(30,27,75,0.85)]">
          {toast}
        </p>
      )}
    </div>
  )
}

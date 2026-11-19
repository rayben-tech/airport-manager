import { ArrowLeft, ArrowRight, ChevronRight, MapPin, Plane, SlidersHorizontal } from 'lucide-react'
import { type ComponentType, type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDuo, PlaneLandingDuo, PlaneTakeoffDuo } from '../components/icons'
import { flights } from '../data/flights'

const destinations = [
  ...new Map(
    flights.filter((f) => f.direction === 'departure').map((f) => [f.toCode, { code: f.toCode, city: f.toCity }]),
  ).values(),
]

const offers = [
  { city: 'Paris', price: '1 850 MAD', photo: '/offers/paris.jpg' },
  { city: 'Istanbul', price: '2 150 MAD', photo: '/offers/istanbul.jpg' },
  { city: 'Dubai', price: '3 400 MAD', photo: '/offers/dubai.jpg' },
  { city: 'Madrid', price: '1 290 MAD', photo: '/offers/madrid.jpg' },
]

const GAP = 16
const roundGlass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md'

function RouteRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  children?: ReactNode
}) {
  return (
    <div className="relative flex h-[72px] items-center gap-3 px-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/60">
        <Icon size={24} className="text-btn-from" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small text-ink-soft">{label}</p>
        <p className="truncate text-value font-bold text-ink">{value}</p>
      </div>
      <ChevronRight size={20} strokeWidth={2.25} className="text-ink" />
      {children}
    </div>
  )
}

function OfferCard({ city, price, photo, onOpen }: (typeof offers)[number] & { onOpen: () => void }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="relative h-32 w-full shrink-0 snap-start overflow-hidden rounded-3xl shadow-glass-light">
      {broken ? (
        <div className="absolute inset-y-0 left-0 flex w-[52%] items-center justify-center bg-linear-to-br from-primary to-pink pr-[8%] text-white">
          <MapPin size={32} strokeWidth={1.75} />
        </div>
      ) : (
        <img
          src={photo}
          alt={city}
          onError={() => setBroken(true)}
          className="absolute inset-y-0 left-0 h-full w-[52%] object-cover"
        />
      )}
      <div className="glass-light absolute inset-y-0 left-[44%] right-0 rounded-3xl px-4 py-3 text-ink">
        <p className="text-dest font-bold leading-tight">{city}</p>
        <p className="mt-1 text-small text-ink-soft">à partir de</p>
        <p className="text-price font-extrabold leading-tight">{price}</p>
        <button
          type="button"
          aria-label={`Voir les vols vers ${city}`}
          onClick={onOpen}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-btn-from to-nav-to text-white shadow-nav-glow"
        >
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default function FlightSearchForm() {
  const navigate = useNavigate()
  const [roundTrip, setRoundTrip] = useState(false)
  const [dest, setDest] = useState('CDG')
  const [page, setPage] = useState(0)
  const city = destinations.find((d) => d.code === dest)?.city ?? ''

  const seg = (active: boolean) =>
    `h-[52px] flex-1 rounded-full text-body ${
      active
        ? 'bg-linear-to-r from-btn-from to-nav-to font-bold text-white shadow-nav-glow'
        : 'border border-white/40 bg-white/25 font-semibold text-white/90 backdrop-blur-md'
    }`

  return (
    <div className="px-5 pt-6">
      <header className="flex items-center text-white">
        <button type="button" aria-label="Retour" onClick={() => navigate(-1)} className={roundGlass}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-title font-semibold">Rechercher un vol</h1>
        <button type="button" aria-label="Filtres" className={roundGlass}>
          <SlidersHorizontal size={20} />
        </button>
      </header>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => setRoundTrip(false)} className={seg(!roundTrip)}>
          Aller simple
        </button>
        <button type="button" onClick={() => setRoundTrip(true)} className={seg(roundTrip)}>
          Aller-retour
        </button>
      </div>

      <div className="glass-light mt-4 divide-y divide-ink/8 rounded-panel">
        <RouteRow icon={PlaneTakeoffDuo} label="Départ" value="Casablanca (CMN)" />
        <RouteRow icon={PlaneLandingDuo} label="Arrivée" value={`${city} (${dest})`}>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            aria-label="Arrivée"
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {destinations.map((d) => (
              <option key={d.code} value={d.code}>
                {d.city} ({d.code})
              </option>
            ))}
          </select>
        </RouteRow>
        <RouteRow icon={CalendarDuo} label="Date" value="18 Nov. 2026" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/vols')}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-linear-to-r from-btn-from to-btn-mid text-section font-bold text-white shadow-search"
      >
        Rechercher <Plane size={20} fill="currentColor" />
      </button>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-section font-bold text-ink">Offres populaires ✨</h2>
        <button type="button" onClick={() => navigate('/vols')} className="text-label font-bold text-btn-from">
          Tout voir →
        </button>
      </div>

      <div
        className="no-scrollbar mt-3 flex snap-x snap-mandatory overflow-x-auto"
        style={{ gap: GAP }}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth + GAP)))}
      >
        {offers.map((o) => (
          <OfferCard key={o.city} {...o} onOpen={() => navigate('/vols')} />
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {offers.map((o, i) => (
          <span
            key={o.city}
            className={`h-1.5 rounded-full transition-all ${i === page ? 'w-[18px] bg-primary' : 'w-1.5 bg-primary/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

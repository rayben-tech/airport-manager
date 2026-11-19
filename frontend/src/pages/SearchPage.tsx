import { ChevronDown, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FlightRow from '../components/FlightRow'
import PageHeader from '../components/PageHeader'
import PlaceIcon from '../components/PlaceIcon'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import { placeTile, placeVisual } from '../components/placeStyle'
import { search } from '../lib/api'
import { useApi, useDebounced } from '../lib/useApi'
import type { Direction, FlightStatus, FlightSummary, SearchResult } from '../types'

const directionChips: { label: string; value: 'all' | Direction }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Départs', value: 'departure' },
  { label: 'Arrivées', value: 'arrival' },
]

const statusChips: { label: string; value: 'all' | FlightStatus }[] = [
  { label: 'Tous statuts', value: 'all' },
  { label: "À l'heure", value: 'on_time' },
  { label: 'Retardé', value: 'delayed' },
  { label: 'Annulé', value: 'cancelled' },
]

/** Country of the other end of the route (CMN is always one side). */
const flightCountry = (f: FlightSummary) => (f.direction === 'departure' ? f.destination.country : f.origin.country)
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fr'))

function Select({ label, value, onChange, all, options }: { label: string; value: string; onChange: (v: string) => void; all: string; options: string[] }) {
  return (
    <label className="glass-light relative flex h-10 min-w-0 flex-1 items-center rounded-full pl-4 pr-9 text-ink">
      <span className="truncate text-label font-semibold">{value || all}</span>
      <ChevronDown size={16} strokeWidth={2.25} className="absolute right-3" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 cursor-pointer opacity-0">
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

const NO_RESULTS: SearchResult = { flights: [], shops: [], gates: [] }

export default function SearchPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [direction, setDirection] = useState<'all' | Direction>('all')
  const [status, setStatus] = useState<'all' | FlightStatus>('all')
  const [country, setCountry] = useState('')
  const [airline, setAirline] = useState('')
  const q = useDebounced(query.trim(), 300)
  const results = useApi(() => (q ? search(q) : Promise.resolve(NO_RESULTS)), [q])

  const found = results.data ?? NO_RESULTS
  const countries = useMemo(() => unique(found.flights.map(flightCountry)), [found])
  const airlines = useMemo(() => unique(found.flights.map((f) => f.airline.name)), [found])
  const flights = found.flights
    .filter((f) => direction === 'all' || f.direction === direction)
    .filter((f) => status === 'all' || f.status === status)
    .filter((f) => !country || flightCountry(f) === country)
    .filter((f) => !airline || f.airline.name === airline)
  const places = [...found.gates, ...found.shops]
  const filtersActive = direction !== 'all' || status !== 'all' || country !== '' || airline !== ''

  const reset = () => {
    setDirection('all')
    setStatus('all')
    setCountry('')
    setAirline('')
  }

  return (
    <div className="px-5">
      <PageHeader title="Recherche" />

      <label className="frost-field mt-4">
        <Search size={20} className="text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Vol, ville, pays, compagnie, porte..."
          className="w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-soft"
        />
        {query && (
          <button type="button" aria-label="Effacer" onClick={() => setQuery('')}>
            <X size={18} />
          </button>
        )}
      </label>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {directionChips.map((c) => (
          <button key={c.value} type="button" onClick={() => setDirection(c.value)} className={direction === c.value ? 'chip-active' : 'chip'}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {statusChips.map((c) => (
          <button key={c.value} type="button" onClick={() => setStatus(c.value)} className={status === c.value ? 'chip-active' : 'chip'}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Select label="Pays" value={country} onChange={setCountry} all="Tous les pays" options={countries} />
        <Select label="Compagnie" value={airline} onChange={setAirline} all="Toutes les compagnies" options={airlines} />
      </div>

      {!q && <EmptyState icon={Search} title="Que cherchez-vous ?" text="Un vol, une ville, un pays, une compagnie ou une porte." className="mt-4" />}
      {q && results.loading && (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-3xl" />
          ))}
        </div>
      )}
      {q && results.error && <ErrorCard message={results.error.message} onRetry={results.reload} className="mt-4" />}

      {q && results.data && (
        <>
          <div className="mt-4 flex items-center justify-between text-label font-semibold text-white">
            <span>
              {flights.length} vol{flights.length > 1 ? 's' : ''}
            </span>
            {filtersActive && (
              <button type="button" onClick={reset} className="underline underline-offset-2">
                Réinitialiser les filtres
              </button>
            )}
          </div>

          <section className="mt-3 space-y-3">
            {flights.map((f) => (
              <FlightRow key={f.id} flight={f} />
            ))}
            {flights.length === 0 && places.length === 0 && (
              <EmptyState icon={SearchX} title="Aucun résultat" text="Essayez un autre mot-clé ou retirez des filtres." />
            )}
          </section>

          {places.length > 0 && (
            <section className="mt-5">
              <h2 className="text-value font-bold text-ink">Portes, commerces et services</h2>
              <div className="frost-card mt-3 divide-y divide-ink/8 rounded-panel">
                {places.map((p) => (
                  <Link key={p.id} to={`/carte?location=${p.id}`} className="flex items-center gap-3 px-4 py-3">
                    <span className={`${placeTile} h-11 w-11`}>
                      <PlaceIcon place={placeVisual(p)} />
                    </span>
                    <div>
                      <p className="text-value font-bold">{p.name}</p>
                      <p className="text-label text-ink-soft">
                        {p.terminal.name} • Niveau {p.floorLevel}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

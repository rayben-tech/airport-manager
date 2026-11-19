import { ChevronDown, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FlightRow from '../components/FlightRow'
import PageHeader from '../components/PageHeader'
import PlaceIcon from '../components/PlaceIcon'
import { placeTile } from '../components/placeStyle'
import { type Direction, type FlightStatus, airlineNames, countries, flights } from '../data/flights'
import { levelLabel, places } from '../data/places'

const directionChips: { label: string; value: 'all' | Direction }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Départs', value: 'departure' },
  { label: 'Arrivées', value: 'arrival' },
]

const statusChips: { label: string; value: 'all' | FlightStatus }[] = [
  { label: 'Tous statuts', value: 'all' },
  { label: "À l'heure", value: "À l'heure" },
  { label: 'Retardé', value: 'Retardé' },
  { label: 'Annulé', value: 'Annulé' },
]

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

export default function SearchPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [direction, setDirection] = useState<'all' | Direction>('all')
  const [status, setStatus] = useState<'all' | FlightStatus>('all')
  const [country, setCountry] = useState('')
  const [airline, setAirline] = useState('')
  const q = query.trim().toLowerCase()

  const foundFlights = flights
    .filter((f) => direction === 'all' || f.direction === direction)
    .filter((f) => status === 'all' || f.status === status)
    .filter((f) => !country || f.country === country)
    .filter((f) => !airline || f.airline === airline)
    .filter(
      (f) =>
        !q ||
        [f.code, f.airline, f.fromCity, f.toCity, f.country, f.gate, f.fromCode, f.toCode].some((v) =>
          v.toLowerCase().includes(q),
        ),
    )
    .sort((a, b) => a.time.localeCompare(b.time))
  const foundPlaces = q ? places.filter((p) => p.name.toLowerCase().includes(q)) : []
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
        <Select label="Compagnie" value={airline} onChange={setAirline} all="Toutes les compagnies" options={airlineNames} />
      </div>

      <div className="mt-4 flex items-center justify-between text-label font-semibold text-white">
        <span>
          {foundFlights.length} vol{foundFlights.length > 1 ? 's' : ''}
        </span>
        {filtersActive && (
          <button type="button" onClick={reset} className="underline underline-offset-2">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <section className="mt-3 space-y-3">
        {foundFlights.map((f) => (
          <FlightRow key={f.id} flight={f} />
        ))}
        {foundFlights.length === 0 && (
          <p className="frost-card p-6 text-center text-body text-ink-soft">Aucun vol trouvé.</p>
        )}
      </section>

      {foundPlaces.length > 0 && (
        <section className="mt-5">
          <h2 className="text-value font-bold text-ink">Portes, commerces et services</h2>
          <div className="frost-card mt-3 divide-y divide-ink/8 rounded-panel">
            {foundPlaces.map((p) => (
              <Link key={p.id} to={`/carte?place=${p.id}`} className="flex items-center gap-3 px-4 py-3">
                <span className={`${placeTile} h-11 w-11`}>
                  <PlaceIcon place={p} />
                </span>
                <div>
                  <p className="text-value font-bold">{p.name}</p>
                  <p className="text-label text-ink-soft">
                    {p.terminal} • {levelLabel(p.level)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

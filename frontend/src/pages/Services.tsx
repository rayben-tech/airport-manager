import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PlaceIcon from '../components/PlaceIcon'
import { placeTile } from '../components/placeStyle'
import { type PlaceKind, levelLabel, places } from '../data/places'

const filters: { label: string; kind: PlaceKind | null }[] = [
  { label: 'Tout', kind: null },
  { label: 'Restaurants', kind: 'restaurant' },
  { label: 'Boutiques', kind: 'boutique' },
  { label: 'Services', kind: 'service' },
]

export default function Services() {
  const [kind, setKind] = useState<PlaceKind | null>(null)
  const list = places.filter((p) => p.kind !== 'gate' && (kind === null || p.kind === kind))

  return (
    <div className="px-5">
      <PageHeader title="Services et commerces" />
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button key={f.label} type="button" onClick={() => setKind(f.kind)} className={kind === f.kind ? 'chip-active' : 'chip'}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="frost-card mt-4 divide-y divide-ink/8 rounded-panel">
        {list.map((p) => (
          <Link key={p.id} to={`/carte?place=${p.id}`} className="flex items-center gap-3 px-4 py-3">
            <span className={`${placeTile} h-12 w-12`}>
              <PlaceIcon place={p} size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-value font-bold">{p.name}</p>
              <p className="text-label text-ink-soft">
                {p.terminal} • {levelLabel(p.level)}
              </p>
              {p.hours && <p className="text-small text-ink-soft">{p.hours}</p>}
            </div>
            <ChevronRight size={18} strokeWidth={2.25} />
          </Link>
        ))}
      </div>
    </div>
  )
}

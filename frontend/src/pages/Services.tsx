import { ChevronRight, Store } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PlaceIcon from '../components/PlaceIcon'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import { placeTile, placeVisual } from '../components/placeStyle'
import { getShops } from '../lib/api'
import { formatHours } from '../lib/format'
import { useApi } from '../lib/useApi'
import type { ShopCategory } from '../types'

const filters: { label: string; category: ShopCategory | null }[] = [
  { label: 'Tout', category: null },
  { label: 'Restaurants', category: 'restaurant' },
  { label: 'Boutiques', category: 'boutique' },
  { label: 'Services', category: 'service' },
]

export default function Services() {
  const [category, setCategory] = useState<ShopCategory | null>(null)
  const shops = useApi(() => getShops(category ?? undefined), [category])

  return (
    <div className="px-5">
      <PageHeader title="Services et commerces" />
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button key={f.label} type="button" onClick={() => setCategory(f.category)} className={category === f.category ? 'chip-active' : 'chip'}>
            {f.label}
          </button>
        ))}
      </div>

      {shops.loading && <Skeleton className="mt-4 h-96 rounded-panel" />}
      {shops.error && <ErrorCard message={shops.error.message} onRetry={shops.reload} className="mt-4 rounded-panel" />}
      {shops.data?.length === 0 && <EmptyState icon={Store} title="Aucun lieu dans cette catégorie" className="mt-4 rounded-panel" />}
      {shops.data && shops.data.length > 0 && (
        <div className="frost-card mt-4 divide-y divide-ink/8 rounded-panel">
          {shops.data.map((p) => (
            <Link key={p.id} to={`/carte?location=${p.id}`} className="flex items-center gap-3 px-4 py-3">
              <span className={`${placeTile} h-12 w-12`}>
                <PlaceIcon place={placeVisual(p)} size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-value font-bold">{p.name}</p>
                <p className="text-label text-ink-soft">
                  {p.terminal.name} • Niveau {p.floorLevel}
                </p>
                {p.shop && <p className="text-small text-ink-soft">{formatHours(p.shop.opensAt, p.shop.closesAt)}</p>}
              </div>
              <ChevronRight size={18} strokeWidth={2.25} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

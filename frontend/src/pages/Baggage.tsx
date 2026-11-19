import { CircleCheck, Luggage } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import { EmptyState, ErrorCard, Skeleton } from '../components/States'
import { Duotone, SuitcaseSolid } from '../components/icons'
import { getBaggage } from '../lib/api'
import { BAG_STEP, BAG_STEPS } from '../lib/format'
import { useApi } from '../lib/useApi'

const kg = (n: number) => `${String(n).replace('.', ',')} kg`

export default function Baggage() {
  const baggage = useApi(getBaggage, [])
  const data = baggage.data
  const flight = data?.flight

  return (
    <div className="px-5">
      <PageHeader title="Bagages" />

      {baggage.loading && (
        <>
          <Skeleton className="mt-4 h-64 rounded-panel" />
          <Skeleton className="mt-5 h-28" />
        </>
      )}
      {baggage.error && <ErrorCard message={baggage.error.message} onRetry={baggage.reload} className="mt-4 rounded-panel" />}
      {data && !flight && (
        <EmptyState icon={Luggage} title="Aucun bagage à suivre" text="Vos bagages apparaîtront ici avant votre prochain vol." className="mt-4 rounded-panel" />
      )}

      {data && flight && (
        <>
          <GlassCard className="mt-4 rounded-panel text-center">
            <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-tile-lg bg-linear-to-br from-primary to-bag-to text-white shadow-nav-glow">
              <SuitcaseSolid size={36} />
            </span>
            <h2 className="mt-3 text-title font-bold">Vol {flight.flightNumber}</h2>
            <p className="text-body text-ink-soft">{data.beltNumber ? 'Votre tapis est disponible au :' : 'Tapis non encore attribué'}</p>
            <p className="mt-3 flex items-center justify-center gap-3 rounded-tile-lg bg-primary/12 py-3 text-flight font-extrabold">
              <Duotone icon={Luggage} size={28} className="text-primary" />
              Tapis n° {data.beltNumber ?? '—'}
            </p>
            <p className="mt-3 text-label text-ink-soft">
              <CircleCheck size={16} className="mr-1.5 inline -mt-0.5 text-green-600" />
              Retrouvez vos bagages au niveau des arrivées.
            </p>
          </GlassCard>

          <h2 className="mt-5 text-title font-bold text-white">Mes bagages ({data.items.length})</h2>
          <div className="mt-3 space-y-4">
            {data.items.length === 0 && <EmptyState icon={Luggage} title="Aucun bagage enregistré pour ce vol" />}
            {data.items.map((bag) => {
              const step = BAG_STEP[bag.status]
              return (
                <GlassCard key={bag.id}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-linear-to-br from-primary to-bag-to text-white">
                      <SuitcaseSolid size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-value font-bold">{bag.label ?? (bag.bagType === 'cabin' ? 'Bagage cabine' : 'Bagage en soute')}</p>
                      <p className="truncate text-small text-ink-soft">
                        Étiquette {bag.tagNumber} • {kg(bag.weightKg)}
                      </p>
                    </div>
                    <Link to={`/vols/${flight.id}`} className="rounded-full bg-primary/12 px-3 py-1 text-small font-bold text-primary">
                      {flight.flightNumber}
                    </Link>
                  </div>
                  <div className="mt-4 flex items-start">
                    {BAG_STEPS.map((label, i) => {
                      const done = i <= step
                      return (
                        <div key={label} className="flex flex-1 flex-col items-center">
                          <div className="flex w-full items-center">
                            <span className={`h-[3px] flex-1 rounded-full ${i === 0 ? 'invisible' : done ? 'bg-primary' : 'bg-ink/10'}`} />
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-tiny font-bold ${
                                done ? 'bg-linear-to-br from-btn-from to-nav-to text-white' : 'border border-white/80 bg-white/60 text-ink-soft'
                              }`}
                            >
                              {done ? '✓' : i + 1}
                            </span>
                            <span
                              className={`h-[3px] flex-1 rounded-full ${
                                i === BAG_STEPS.length - 1 ? 'invisible' : i < step ? 'bg-primary' : 'bg-ink/10'
                              }`}
                            />
                          </div>
                          <span className={`mt-1 text-tiny ${i === step ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

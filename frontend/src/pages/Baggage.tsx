import { CircleCheck, Luggage } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import { Duotone, SuitcaseSolid } from '../components/icons'
import { baggageSteps, bags } from '../data/baggage'
import { getFlight } from '../data/flights'
import { passenger } from '../data/passenger'

export default function Baggage() {
  const flight = getFlight(passenger.nextFlightId)

  return (
    <div className="px-5">
      <PageHeader title="Bagages" />

      <GlassCard className="mt-4 rounded-panel text-center">
        <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-tile-lg bg-linear-to-br from-primary to-bag-to text-white shadow-nav-glow">
          <SuitcaseSolid size={36} />
        </span>
        <h2 className="mt-3 text-title font-bold">Vol {flight?.code}</h2>
        <p className="text-body text-ink-soft">Votre tapis est disponible au :</p>
        <p className="mt-3 flex items-center justify-center gap-3 rounded-tile-lg bg-primary/12 py-3 text-flight font-extrabold">
          <Duotone icon={Luggage} size={28} className="text-primary" />
          Tapis n° {flight?.belt ?? '—'}
        </p>
        <p className="mt-3 text-label text-ink-soft">
          <CircleCheck size={16} className="mr-1.5 inline -mt-0.5 text-green-600" />
          Retrouvez vos bagages au niveau des arrivées.
        </p>
      </GlassCard>

      <h2 className="mt-5 text-title font-bold text-white">Mes bagages ({bags.length})</h2>
      <div className="mt-3 space-y-4">
        {bags.map((bag) => {
          const f = getFlight(bag.flightId)
          return (
            <GlassCard key={bag.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-linear-to-br from-primary to-bag-to text-white">
                  <SuitcaseSolid size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-value font-bold">{bag.name}</p>
                  <p className="truncate text-small text-ink-soft">
                    Étiquette {bag.tag} • {bag.weight}
                  </p>
                </div>
                {f && (
                  <Link to={`/vols/${f.id}`} className="rounded-full bg-primary/12 px-3 py-1 text-small font-bold text-primary">
                    {f.code}
                  </Link>
                )}
              </div>
              <div className="mt-4 flex items-start">
                {baggageSteps.map((label, i) => {
                  const done = i <= bag.step
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
                            i === baggageSteps.length - 1 ? 'invisible' : i < bag.step ? 'bg-primary' : 'bg-ink/10'
                          }`}
                        />
                      </div>
                      <span className={`mt-1 text-tiny ${i === bag.step ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

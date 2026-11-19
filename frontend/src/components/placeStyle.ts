import type { Place } from '../data/places'

/** Map pin color and label color per kind of place. */
export const kindStyle: Record<Place['kind'], { pin: string; label: string; name: string }> = {
  gate: { pin: 'bg-pin-gate', label: 'text-pin-gate', name: 'Porte d’embarquement' },
  restaurant: { pin: 'bg-pin-food', label: 'text-pin-food', name: 'Restaurant' },
  boutique: { pin: 'bg-pin-shop', label: 'text-pin-shop', name: 'Boutique' },
  service: { pin: 'bg-pin-service', label: 'text-pin-service', name: 'Service' },
}

/** Violet icon tile used in lists and cards. */
export const placeTile = 'flex shrink-0 items-center justify-center rounded-chip bg-primary/12 text-primary'

import type { Location } from '../types'

/** Visual category of a place on the map and in lists. */
export type PlaceKind = 'gate' | 'restaurant' | 'boutique' | 'service'
export type ServiceIcon = 'toilet' | 'pharmacy' | 'info' | 'prayer' | 'belt' | 'exchange' | 'car' | 'lounge' | 'kids'

export interface PlaceVisual {
  kind: PlaceKind
  icon?: ServiceIcon
}

export function placeKind(loc: Location): PlaceKind {
  if (loc.locationType === 'gate') return 'gate'
  if (loc.shop?.category === 'restaurant') return 'restaurant'
  if (loc.shop?.category === 'boutique') return 'boutique'
  return 'service'
}

/** Service icon chosen from the place's slug (purely a display choice). */
export function serviceIcon(loc: Location): ServiceIcon {
  const s = loc.slug
  if (loc.locationType === 'baggage_belt' || s.startsWith('tapis')) return 'belt'
  if (s.startsWith('wc') || s.includes('toilettes')) return 'toilet'
  if (s.startsWith('pharmacie')) return 'pharmacy'
  if (s.startsWith('priere')) return 'prayer'
  if (s.startsWith('change')) return 'exchange'
  if (s.startsWith('location')) return 'car'
  if (s.startsWith('salon')) return 'lounge'
  if (s.startsWith('enfants')) return 'kids'
  return 'info'
}

export const placeVisual = (loc: Location): PlaceVisual => ({ kind: placeKind(loc), icon: serviceIcon(loc) })

/** Map pin color and label color per kind of place. */
export const kindStyle: Record<PlaceKind, { pin: string; label: string; name: string }> = {
  gate: { pin: 'bg-pin-gate', label: 'text-pin-gate', name: 'Porte d’embarquement' },
  restaurant: { pin: 'bg-pin-food', label: 'text-pin-food', name: 'Restaurant' },
  boutique: { pin: 'bg-pin-shop', label: 'text-pin-shop', name: 'Boutique' },
  service: { pin: 'bg-pin-service', label: 'text-pin-service', name: 'Service' },
}

/** Violet icon tile used in lists and cards. */
export const placeTile = 'flex shrink-0 items-center justify-center rounded-chip bg-primary/12 text-primary'

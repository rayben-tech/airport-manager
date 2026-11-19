import {
  Baby,
  Banknote,
  Car,
  Info,
  Luggage,
  MoonStar,
  Pill,
  Plane,
  ShoppingBag,
  Sofa,
  Toilet,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Place, ServiceIcon } from '../data/places'
import { Duotone } from './icons'

const serviceIcons: Record<ServiceIcon, LucideIcon> = {
  toilet: Toilet,
  pharmacy: Pill,
  info: Info,
  prayer: MoonStar,
  belt: Luggage,
  exchange: Banknote,
  car: Car,
  lounge: Sofa,
  kids: Baby,
}

function iconFor(place: Place): LucideIcon {
  if (place.kind === 'gate') return Plane
  if (place.kind === 'restaurant') return Utensils
  if (place.kind === 'boutique') return ShoppingBag
  return place.icon ? serviceIcons[place.icon] : Info
}

/** Duotone icon for a place; `solid` drops the tint (white icons on colored pins). */
export default function PlaceIcon({ place, size = 22, solid = false }: { place: Place; size?: number; solid?: boolean }) {
  return <Duotone icon={iconFor(place)} size={size} plain={solid} />
}

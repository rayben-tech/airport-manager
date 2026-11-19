/** Mirrors the JSON returned by the FastAPI backend (backend/app/schemas.py), camelCase. */

/** Airport local time without timezone, for example "2026-11-18T13:15:00". Never convert it. */
export type LocalDateTime = string
/** "08:00:00" */
export type LocalTime = string

export type UserRole = 'passenger' | 'employee' | 'admin'
export type LoyaltyTier = 'standard' | 'premium'
export type LocationType = 'gate' | 'shop' | 'service' | 'baggage_belt' | 'checkpoint' | 'entrance'
export type ShopCategory = 'restaurant' | 'boutique' | 'service'
export type Direction = 'departure' | 'arrival'
export type FlightStatus = 'on_time' | 'delayed' | 'boarding' | 'departed' | 'landed' | 'cancelled'
export type CabinClass = 'economy' | 'business' | 'first'
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'
export type BookingTab = 'upcoming' | 'past' | 'cancelled'
export type BagType = 'cabin' | 'checked'
export type BagStatus = 'registered' | 'screened' | 'loaded' | 'delivered'
export type Level = 0 | 1 | 2

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  userRole: UserRole
  createdAt: LocalDateTime
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface Airline {
  id: number
  iataCode: string
  name: string
  brandColor: string
}

export interface Airport {
  id: number
  iataCode: string
  name: string
  city: string
  country: string
}

export interface AircraftModel {
  id: number
  name: string
  seats: number
}

export interface Aircraft {
  id: number
  registration: string
  model: AircraftModel
}

export interface Terminal {
  id: number
  name: string
  terminalCode: string
}

export interface ShopInfo {
  category: ShopCategory
  opensAt: LocalTime
  closesAt: LocalTime
  isOpenNow: boolean
}

export interface Location {
  id: number
  slug: string
  name: string
  locationType: LocationType
  floorLevel: number
  x: number
  y: number
  description: string | null
  nodeId: number | null
  terminal: Terminal
  gateCode: string | null
  beltNumber: number | null
  shop: ShopInfo | null
}

export interface Gate {
  id: number
  gateCode: string
  location: Location
}

export interface BaggageBelt {
  id: number
  beltNumber: number
  locationId: number
}

export interface FlightSummary {
  id: number
  flightNumber: string
  direction: Direction
  status: FlightStatus
  departsAt: LocalDateTime
  arrivesAt: LocalDateTime
  boardingAt: LocalDateTime | null
  durationMinutes: number
  airline: Airline
  origin: Airport
  destination: Airport
  gateCode: string | null
  terminalName: string | null
  arrivalTerminal: string | null
  beltNumber: number | null
}

export interface FlightDetail extends FlightSummary {
  aircraft: Aircraft | null
  gate: Gate | null
  terminal: Terminal | null
  baggageBelt: BaggageBelt | null
}

export interface FlightPage {
  items: FlightSummary[]
  total: number
  page: number
  pageSize: number
}

export interface LocationDetail extends Location {
  upcomingFlights: FlightSummary[]
}

export interface SearchResult {
  flights: FlightSummary[]
  shops: Location[]
  gates: Location[]
}

export interface Offer {
  id: number
  priceMad: number
  imagePath: string
  displayOrder: number
  destination: Airport
}

export interface PassengerStats {
  completedFlights: number
  confirmedReservations: number
  cancelledBookings: number
}

export interface Profile extends User {
  phone: string | null
  nationality: string | null
  loyaltyTier: LoyaltyTier | null
  rating: number | null
  stats: PassengerStats
}

export interface BaggageItem {
  id: number
  bagType: BagType
  label: string | null
  weightKg: number
  sizeCm: string | null
  tagNumber: string
  status: BagStatus
}

export interface Booking {
  id: number
  bookingRef: string
  seat: string | null
  cabinClass: CabinClass
  status: BookingStatus
  ticketCode: string
  checkedInAt: LocalDateTime | null
  createdAt: LocalDateTime
  flight: FlightSummary
  baggageItems: BaggageItem[]
}

export interface BaggageOverview {
  flight: FlightSummary | null
  bookingRef: string | null
  beltNumber: number | null
  items: BaggageItem[]
}

export interface FavoriteState {
  flightId: number
  isFavorite: boolean
}

export interface SavedState {
  locationId: number
  isSaved: boolean
}

export interface Notification {
  id: number
  title: string
  body: string
  isRead: boolean
  createdAt: LocalDateTime
}

export interface RoutePoint {
  x: number
  y: number
  floorLevel: number
}

export interface Route {
  fromNodeId: number
  toLocationId: number
  points: RoutePoint[]
  distanceMeters: number
  minutes: number
  changesLevel: boolean
  note: string | null
}

export interface StatusShare {
  status: FlightStatus
  count: number
  percent: number
}

export interface GateUsage {
  gateCode: string
  departures: number
}

export interface AdminStats {
  date: string
  total: number
  departures: number
  arrivals: number
  delayed: number
  cancelled: number
  statusDistribution: StatusShare[]
  topGates: GateUsage[]
}

export const passenger = {
  firstName: 'Wissal',
  fullName: 'Wissal EL BOUAZZAOUI',
  email: 'wissal@email.com',
  nextFlightId: 'AF1597',
  stats: { flights: 12, bookings: 8, rating: 4.8 },
}

export type TripTab = 'upcoming' | 'past' | 'cancelled'

export interface Trip {
  flightId: string
  day: string
  month: string
  tab: TripTab
}

export const trips: Trip[] = [
  { flightId: 'AF1597', day: '18', month: 'Nov.', tab: 'upcoming' },
  { flightId: 'AT706', day: '24', month: 'Déc.', tab: 'upcoming' },
  { flightId: 'BA126', day: '02', month: 'Oct.', tab: 'past' },
  { flightId: 'AT200', day: '15', month: 'Sep.', tab: 'past' },
  { flightId: 'TP1394', day: '05', month: 'Nov.', tab: 'cancelled' },
]

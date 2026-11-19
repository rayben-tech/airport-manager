export const baggageSteps = ['Enregistré', 'Contrôlé', 'Chargé', 'Livré'] as const

export interface Bag {
  id: string
  tag: string
  name: string
  weight: string
  flightId: string
  /** index in baggageSteps of the current step */
  step: number
}

export const bags: Bag[] = [
  { id: 'b1', tag: 'AF1597-48217', name: 'Bagage en soute', weight: '23 kg', flightId: 'AF1597', step: 2 },
  { id: 'b2', tag: 'AF1597-48218', name: 'Bagage cabine', weight: '8 kg', flightId: 'AF1597', step: 1 },
  { id: 'b3', tag: 'BA126-90311', name: 'Valise rouge', weight: '19 kg', flightId: 'BA126', step: 3 },
]

/**
 * Airport places and walkable graph: single source of truth for /carte, /services and /recherche.
 * Coordinates are map units on a 1000 × 1400 plan (1 unit ≈ 0.4 m).
 * Levels: 0 = arrivals (baggage claim), 1 = mezzanine (food, services), 2 = departures (security, hall, gates).
 */

export type PlaceKind = 'gate' | 'restaurant' | 'boutique' | 'service'
export type Level = 0 | 1 | 2
export type ServiceIcon = 'toilet' | 'pharmacy' | 'info' | 'prayer' | 'belt' | 'exchange' | 'car' | 'lounge' | 'kids'

export interface Place {
  id: string
  name: string
  kind: PlaceKind
  level: Level
  terminal: string
  x: number
  y: number
  hours?: string
  description?: string
  /** icon for services (gates, restaurants and shops use the category icon) */
  icon?: ServiceIcon
}

export const LEVELS: Level[] = [2, 1, 0]
export const levelLabel = (level: Level) => `Niveau ${level}`

const T1 = 'Terminal 1'

const gate = (code: string, x: number, y: number): Place => ({
  id: `gate-${code}`,
  name: `Porte ${code}`,
  kind: 'gate',
  level: 2,
  terminal: T1,
  x,
  y,
})

export const places: Place[] = [
  // ---- Level 2: gates (Jetée A west, Jetée B east), grand hall ----
  gate('A02', 170, 240),
  gate('A04', 270, 240),
  gate('A06', 170, 420),
  gate('A08', 270, 420),
  gate('A10', 170, 600),
  gate('A12', 270, 600),
  gate('B02', 730, 240),
  gate('B04', 830, 240),
  gate('B06', 730, 420),
  gate('B08', 830, 420),
  gate('B10', 730, 600),
  gate('B12', 830, 600),
  { id: 'duty-free', name: 'Duty Free', kind: 'boutique', level: 2, terminal: T1, x: 500, y: 830, hours: '06:00 – 23:00', description: 'Parfums, cosmétiques, chocolats et alcools hors taxes.' },
  { id: 'souk', name: 'Souk du Voyageur', kind: 'boutique', level: 2, terminal: T1, x: 360, y: 900, hours: '09:00 – 21:00', description: 'Artisanat marocain : céramiques, tapis et objets en cuir.' },
  { id: 'cafe-jetees', name: 'Café des Jetées', kind: 'restaurant', level: 2, terminal: T1, x: 220, y: 330, hours: '05:30 – 22:00', description: 'Cafés, jus pressés et viennoiseries à emporter.' },
  { id: 'patisserie', name: 'Pâtisserie Marrakech', kind: 'restaurant', level: 2, terminal: T1, x: 780, y: 330, hours: '06:00 – 21:00', description: 'Pâtisseries marocaines et thé à la menthe.' },
  { id: 'librairie', name: 'Librairie du Voyage', kind: 'boutique', level: 2, terminal: T1, x: 220, y: 510, hours: '07:00 – 22:00', description: 'Presse, livres, guides de voyage et accessoires.' },
  { id: 'maroquinerie', name: 'Maroquinerie de Fès', kind: 'boutique', level: 2, terminal: T1, x: 780, y: 510, hours: '08:00 – 21:00', description: 'Sacs, ceintures et petite maroquinerie artisanale.' },
  { id: 'wc-a', name: 'Toilettes Jetée A', kind: 'service', level: 2, terminal: T1, x: 220, y: 700, icon: 'toilet', hours: '24h/24', description: 'Toilettes, espace bébé et accès PMR.' },
  { id: 'wc-b', name: 'Toilettes Jetée B', kind: 'service', level: 2, terminal: T1, x: 780, y: 700, icon: 'toilet', hours: '24h/24', description: 'Toilettes, espace bébé et accès PMR.' },
  { id: 'information', name: 'Information', kind: 'service', level: 2, terminal: T1, x: 350, y: 1010, icon: 'info', hours: '24h/24', description: 'Renseignements sur les vols, objets trouvés et assistance.' },
  { id: 'priere', name: 'Salle de prière', kind: 'service', level: 2, terminal: T1, x: 640, y: 900, icon: 'prayer', hours: '24h/24', description: 'Espaces séparés hommes et femmes, ablutions.' },

  // ---- Level 1: mezzanine ----
  { id: 'starbucks', name: 'Starbucks', kind: 'restaurant', level: 1, terminal: T1, x: 360, y: 900, hours: '08:00 – 22:00', description: 'Cafés, boissons fraîches et snacks.' },
  { id: 'le-voyage', name: 'Restaurant Le Voyage', kind: 'restaurant', level: 1, terminal: T1, x: 640, y: 900, hours: '07:00 – 22:00', description: 'Cuisine marocaine et internationale, service à table.' },
  { id: 'food-court', name: 'Food court Atlas', kind: 'restaurant', level: 1, terminal: T1, x: 500, y: 830, hours: '06:00 – 23:00', description: 'Tajines, sandwichs, salades et glaces.' },
  { id: 'saveurs', name: 'Saveurs du Maroc', kind: 'boutique', level: 1, terminal: T1, x: 500, y: 960, hours: '08:00 – 22:00', description: 'Épices, huile d’argan, dattes et thés.' },
  { id: 'pharmacie', name: 'Pharmacie', kind: 'service', level: 1, terminal: T1, x: 350, y: 1010, icon: 'pharmacy', hours: '08:00 – 21:00', description: 'Médicaments, parapharmacie et premiers soins.' },
  { id: 'wc', name: 'Toilettes', kind: 'service', level: 1, terminal: T1, x: 650, y: 1010, icon: 'toilet', hours: '24h/24', description: 'Toilettes, espace bébé et accès PMR.' },
  { id: 'salon', name: 'Salon Premium', kind: 'service', level: 1, terminal: T1, x: 220, y: 760, icon: 'lounge', hours: '05:00 – 23:30', description: 'Salon d’attente, collations et Wi-Fi rapide.' },
  { id: 'enfants', name: 'Espace enfants', kind: 'service', level: 1, terminal: T1, x: 780, y: 760, icon: 'kids', hours: '07:00 – 21:00', description: 'Aire de jeux sécurisée pour les 2–10 ans.' },

  // ---- Level 0: arrivals and baggage claim ----
  ...([1, 2, 3, 4, 5, 6] as const).map(
    (n, i): Place => ({
      id: `tapis-${n}`,
      name: `Tapis ${n}`,
      kind: 'service',
      level: 0,
      terminal: T1,
      x: 280 + i * 88,
      y: 1250,
      icon: 'belt',
      hours: '24h/24',
      description: 'Livraison des bagages. Le numéro du tapis est indiqué sur les écrans.',
    }),
  ),
  { id: 'change', name: 'Bureau de change', kind: 'service', level: 0, terminal: T1, x: 300, y: 1180, icon: 'exchange', hours: '06:00 – 23:00', description: 'Change de devises et retrait d’espèces.' },
  { id: 'info-arrivees', name: 'Information arrivées', kind: 'service', level: 0, terminal: T1, x: 700, y: 1180, icon: 'info', hours: '24h/24', description: 'Accueil, transports vers Casablanca et objets trouvés.' },
  { id: 'wc-arrivees', name: 'Toilettes arrivées', kind: 'service', level: 0, terminal: T1, x: 500, y: 1180, icon: 'toilet', hours: '24h/24', description: 'Toilettes, espace bébé et accès PMR.' },
  { id: 'location', name: 'Location de voitures', kind: 'service', level: 0, terminal: T1, x: 500, y: 1320, icon: 'car', hours: '06:00 – 00:00', description: 'Comptoirs des loueurs, retrait des clés au parking P1.' },
  { id: 'cafe-arrivees', name: 'Café Arrivées', kind: 'restaurant', level: 0, terminal: T1, x: 400, y: 1180, hours: '05:00 – 00:00', description: 'Boissons chaudes et petite restauration.' },
  { id: 'kiosque', name: 'Kiosque presse', kind: 'boutique', level: 0, terminal: T1, x: 600, y: 1180, hours: '06:00 – 23:00', description: 'Journaux, cartes SIM et recharges téléphoniques.' },
]

export const getPlace = (id: string) => places.find((p) => p.id === id)

// ---- Walkable graph (corridors and halls). Same layout on every level, linked by the elevator. ----

export interface GraphNode {
  id: string
  x: number
  y: number
}

const spine = (prefix: string, x: number): GraphNode[] =>
  [160, 240, 330, 420, 510, 600, 700, 760, 860].map((y) => ({ id: `${prefix}${y}`, x, y }))

export const graphNodes: GraphNode[] = [
  { id: 'you', x: 500, y: 1060 }, // "Vous êtes ici": security exit, level 2
  { id: 'elevator', x: 600, y: 1060 },
  { id: 'sec', x: 500, y: 1120 },
  { id: 'chk', x: 500, y: 1230 },
  { id: 'chkW', x: 300, y: 1230 },
  { id: 'chkE', x: 700, y: 1230 },
  { id: 'ent', x: 500, y: 1320 },
  { id: 'hS', x: 500, y: 1010 },
  { id: 'hC', x: 500, y: 940 },
  { id: 'hN', x: 500, y: 860 },
  { id: 'hW', x: 360, y: 940 },
  { id: 'hE', x: 640, y: 940 },
  ...spine('a', 220),
  ...spine('b', 780),
]

const chain = (prefix: string): [string, string][] => {
  const ys = [160, 240, 330, 420, 510, 600, 700, 760, 860]
  return ys.slice(1).map((y, i) => [`${prefix}${ys[i]}`, `${prefix}${y}`])
}

export const graphEdges: [string, string][] = [
  ['you', 'hS'],
  ['you', 'sec'],
  ['you', 'elevator'],
  ['elevator', 'hS'],
  ['elevator', 'sec'],
  ['sec', 'chk'],
  ['chk', 'chkW'],
  ['chk', 'chkE'],
  ['chk', 'ent'],
  ['hS', 'hC'],
  ['hS', 'hW'],
  ['hS', 'hE'],
  ['hC', 'hN'],
  ['hC', 'hW'],
  ['hC', 'hE'],
  ['hW', 'a860'],
  ['hE', 'b860'],
  ...chain('a'),
  ...chain('b'),
]

export const USER_LEVEL: Level = 2
export const USER_NODE = 'you'
export const ELEVATOR_NODE = 'elevator'

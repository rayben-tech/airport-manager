export type FlightStatus = "À l'heure" | 'Retardé' | 'Annulé'
export type Direction = 'departure' | 'arrival'

export interface Flight {
  id: string
  code: string
  airline: string
  airlineColor: string
  direction: Direction
  fromCity: string
  toCity: string
  fromCode: string
  toCode: string
  /** country of the other end of the route (Morocco is always the other side) */
  country: string
  countryCode: string
  /** scheduled time at Casablanca (CMN) */
  time: string
  departureTime: string
  arrivalTime: string
  fromTerminal: string
  toTerminal: string
  gate: string
  boarding: string
  aircraft: string
  duration: string
  status: FlightStatus
  belt?: number
}

export const airlines: Record<string, { name: string; color: string }> = {
  AT: { name: 'Royal Air Maroc', color: '#c1272d' },
  AF: { name: 'Air France', color: '#1d3f94' },
  IB: { name: 'Iberia', color: '#d7192d' },
  EK: { name: 'Emirates', color: '#c8102e' },
  TK: { name: 'Turkish Airlines', color: '#e81932' },
  QR: { name: 'Qatar Airways', color: '#5c0632' },
  LH: { name: 'Lufthansa', color: '#05164d' },
  BA: { name: 'British Airways', color: '#075aaa' },
  KL: { name: 'KLM', color: '#00a1de' },
  FR: { name: 'Ryanair', color: '#073590' },
  U2: { name: 'easyJet', color: '#ff6600' },
  TP: { name: 'TAP Air Portugal', color: '#d6001c' },
  AZ: { name: 'ITA Airways', color: '#0a4aa6' },
  SV: { name: 'Saudia', color: '#006c35' },
  MS: { name: 'EgyptAir', color: '#1a3a8f' },
  ET: { name: 'Ethiopian Airlines', color: '#078930' },
  TU: { name: 'Tunisair', color: '#e2001a' },
  AC: { name: 'Air Canada', color: '#f01428' },
  DL: { name: 'Delta', color: '#003366' },
  SN: { name: 'Brussels Airlines', color: '#0b2a5b' },
  LX: { name: 'Swiss', color: '#d52b1e' },
}

type Row = [
  code: string,
  dir: 'D' | 'A',
  city: string,
  iata: string,
  country: string,
  cc: string,
  time: string,
  durationMin: number,
  gate: string,
  status: FlightStatus,
  aircraft: string,
  otherTerminal: string,
  belt?: number,
]

const rows: Row[] = [
  ['AF1597', 'D', 'Paris', 'CDG', 'France', 'FR', '13:15', 185, 'B12', "À l'heure", 'Airbus A320', 'Terminal 2F', 3],
  ['AT706', 'D', 'Istanbul', 'IST', 'Turquie', 'TR', '10:40', 275, 'A04', "À l'heure", 'Boeing 737', 'Terminal 1'],
  ['AF1496', 'A', 'Paris', 'CDG', 'France', 'FR', '14:50', 190, 'B04', "À l'heure", 'Airbus A320', 'Terminal 2F', 3],
  ['IB1972', 'A', 'Madrid', 'MAD', 'Espagne', 'ES', '15:10', 115, 'A10', 'Retardé', 'Airbus A321', 'Terminal 4', 5],
  ['EK752', 'A', 'Dubaï', 'DXB', 'Émirats arabes unis', 'AE', '16:00', 440, 'B06', "À l'heure", 'Airbus A380', 'Terminal 3', 2],
  ['AT800', 'D', 'Madrid', 'MAD', 'Espagne', 'ES', '15:20', 115, 'A10', 'Retardé', 'Boeing 737', 'Terminal 4'],
  ['TK618', 'D', 'Istanbul', 'IST', 'Turquie', 'TR', '16:45', 285, 'B04', "À l'heure", 'Airbus A330', 'Terminal 1'],
  ['AT788', 'A', 'Marrakech', 'RAK', 'Maroc', 'MA', '16:30', 50, 'A08', "À l'heure", 'ATR 72', 'Terminal 1', 4],
  ['BA125', 'D', 'Londres', 'LHR', 'Royaume-Uni', 'GB', '06:40', 220, 'A04', "À l'heure", 'Airbus A320', 'Terminal 5'],
  ['BA126', 'A', 'Londres', 'LHR', 'Royaume-Uni', 'GB', '13:05', 215, 'A04', "À l'heure", 'Airbus A320', 'Terminal 5', 1],
  ['QR1394', 'D', 'Doha', 'DOH', 'Qatar', 'QA', '23:15', 405, 'B10', "À l'heure", 'Boeing 787', 'Terminal 1'],
  ['QR1395', 'A', 'Doha', 'DOH', 'Qatar', 'QA', '05:50', 400, 'B10', "À l'heure", 'Boeing 787', 'Terminal 1', 2],
  ['LH1297', 'D', 'Francfort', 'FRA', 'Allemagne', 'DE', '11:10', 245, 'B02', 'Retardé', 'Airbus A321', 'Terminal 1'],
  ['KL1228', 'D', 'Amsterdam', 'AMS', 'Pays-Bas', 'NL', '12:25', 240, 'B08', "À l'heure", 'Boeing 737', 'Terminal 3'],
  ['AZ877', 'D', 'Rome', 'FCO', 'Italie', 'IT', '09:35', 200, 'A12', "À l'heure", 'Airbus A320', 'Terminal 3'],
  ['TP1393', 'D', 'Lisbonne', 'LIS', 'Portugal', 'PT', '10:00', 105, 'A08', "À l'heure", 'Airbus A319', 'Terminal 1'],
  ['TP1394', 'A', 'Lisbonne', 'LIS', 'Portugal', 'PT', '19:20', 105, 'A08', 'Annulé', 'Airbus A319', 'Terminal 1', 3],
  ['SN3772', 'D', 'Bruxelles', 'BRU', 'Belgique', 'BE', '07:55', 225, 'B02', "À l'heure", 'Airbus A320', 'Terminal 1'],
  ['LX2557', 'A', 'Zurich', 'ZRH', 'Suisse', 'CH', '17:40', 230, 'B08', "À l'heure", 'Airbus A220', 'Terminal 2', 5],
  ['MS797', 'D', 'Le Caire', 'CAI', 'Égypte', 'EG', '21:30', 330, 'B06', "À l'heure", 'Airbus A330', 'Terminal 3'],
  ['MS798', 'A', 'Le Caire', 'CAI', 'Égypte', 'EG', '13:45', 325, 'B06', 'Retardé', 'Airbus A330', 'Terminal 3', 4],
  ['DL153', 'D', 'New York', 'JFK', 'États-Unis', 'US', '12:00', 480, 'B10', "À l'heure", 'Boeing 767', 'Terminal 4'],
  ['AT200', 'A', 'New York', 'JFK', 'États-Unis', 'US', '08:30', 450, 'B10', "À l'heure", 'Boeing 787', 'Terminal 1', 6],
  ['AC871', 'D', 'Montréal', 'YUL', 'Canada', 'CA', '13:20', 450, 'B04', 'Retardé', 'Boeing 787', 'Terminal 1'],
  ['AT511', 'D', 'Dakar', 'DSS', 'Sénégal', 'SN', '17:15', 245, 'A12', "À l'heure", 'Boeing 737', 'Terminal 1'],
  ['AT512', 'A', 'Dakar', 'DSS', 'Sénégal', 'SN', '09:10', 240, 'A10', "À l'heure", 'Boeing 737', 'Terminal 1', 1],
  ['AT555', 'D', 'Abidjan', 'ABJ', "Côte d'Ivoire", 'CI', '22:05', 355, 'A04', "À l'heure", 'Boeing 787', 'Terminal 1'],
  ['TU713', 'A', 'Tunis', 'TUN', 'Tunisie', 'TN', '18:25', 120, 'B02', "À l'heure", 'Airbus A320', 'Terminal 1', 3],
  ['SV1122', 'D', 'Djeddah', 'JED', 'Arabie saoudite', 'SA', '20:40', 360, 'B06', "À l'heure", 'Boeing 777', 'Terminal 1'],
  ['ET931', 'A', 'Addis-Abeba', 'ADD', 'Éthiopie', 'ET', '04:55', 420, 'B10', "À l'heure", 'Boeing 787', 'Terminal 2', 2],
  ['FR8821', 'D', 'Barcelone', 'BCN', 'Espagne', 'ES', '08:10', 130, 'B08', "À l'heure", 'Boeing 737', 'Terminal 2'],
  ['U2815', 'A', 'Londres', 'LGW', 'Royaume-Uni', 'GB', '21:15', 225, 'B08', 'Retardé', 'Airbus A320', 'Terminal N', 5],
]

const pad = (n: number) => String(n).padStart(2, '0')

function shift(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export const flights: Flight[] = rows.map(
  ([code, dir, city, iata, country, cc, time, dur, gate, status, aircraft, otherTerminal, belt]) => {
    const airline = airlines[code.slice(0, 2)]
    const departure = dir === 'D'
    const cmnTerminal = gate.startsWith('C') ? 'Terminal 2' : 'Terminal 1'
    return {
      id: code,
      code,
      airline: airline.name,
      airlineColor: airline.color,
      direction: departure ? 'departure' : 'arrival',
      fromCity: departure ? 'Casablanca' : city,
      toCity: departure ? city : 'Casablanca',
      fromCode: departure ? 'CMN' : iata,
      toCode: departure ? iata : 'CMN',
      country,
      countryCode: cc,
      time,
      departureTime: departure ? time : shift(time, -dur),
      arrivalTime: departure ? shift(time, dur) : time,
      fromTerminal: departure ? cmnTerminal : otherTerminal,
      toTerminal: departure ? otherTerminal : cmnTerminal,
      gate,
      boarding: departure ? shift(time, -40) : '—',
      aircraft,
      duration: `≈ ${Math.floor(dur / 60)}h ${pad(dur % 60)}`,
      status,
      belt,
    }
  },
)

export const countries = [...new Set(flights.map((f) => f.country))].sort((a, b) => a.localeCompare(b, 'fr'))
export const airlineNames = [...new Set(flights.map((f) => f.airline))].sort()

export const getFlight = (id: string) => flights.find((f) => f.id === id)

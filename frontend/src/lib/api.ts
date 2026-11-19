import type {
  AdminStats,
  Airline,
  BaggageOverview,
  Booking,
  BookingTab,
  Direction,
  FavoriteState,
  FlightDetail,
  FlightPage,
  FlightStatus,
  Location,
  LocationDetail,
  LocationType,
  Notification,
  Offer,
  Profile,
  Route,
  SavedState,
  SearchResult,
  ShopCategory,
  TokenResponse,
  User,
} from '../types'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
const TOKEN_KEY = 'cmn.token'

/** Error carrying the French message sent by the server. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* storage unavailable: the session lasts until the page is closed */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* nothing to clear */
    }
  },
}

let unauthorizedHandler: (() => void) | null = null
/** Called when an authenticated request gets a 401 (expired or invalid session). */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

type Query = Record<string, string | number | null | undefined>

const FALLBACK: Record<number, string> = {
  0: 'Impossible de joindre le serveur. Vérifiez que l’API est démarrée.',
  401: 'Authentification requise.',
  403: 'Accès refusé.',
  404: 'Ressource introuvable.',
  422: 'Données invalides.',
  503: 'Service momentanément indisponible. Réessayez plus tard.',
}

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') return body.detail
  return FALLBACK[status] ?? 'Une erreur est survenue. Réessayez.'
}

async function send(path: string, init: { method?: string; body?: unknown; query?: Query } = {}): Promise<unknown> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const url = `${BASE_URL}${path}${params.size ? `?${params}` : ''}`
  const token = tokenStore.get()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) })
  } catch {
    throw new ApiError(0, FALLBACK[0])
  }
  const text = res.status === 204 ? '' : await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear()
      unauthorizedHandler?.()
    }
    throw new ApiError(res.status, messageFrom(body, res.status))
  }
  return body
}

/** Typed JSON request. The backend schema is the contract, so the cast is the single trust boundary. */
async function get<T>(path: string, query?: Query): Promise<T> {
  return (await send(path, { query })) as T
}
async function write<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body?: unknown): Promise<T> {
  return (await send(path, { method, body: body ?? {} })) as T
}
async function remove(path: string): Promise<void> {
  await send(path, { method: 'DELETE' })
}

// ---- auth
export const login = (email: string, password: string) => write<TokenResponse>('POST', '/auth/login', { email, password })
export const getCurrentUser = () => get<User>('/auth/me')

// ---- me
export const getProfile = () => get<Profile>('/me')
export const getNextFlight = () => get<Booking>('/me/next-flight')
export const getBookings = (status: BookingTab) => get<Booking[]>('/me/bookings', { status })
export const getBaggage = () => get<BaggageOverview>('/me/baggage')
export const getNotifications = () => get<Notification[]>('/me/notifications')
export const getFavorite = (flightId: number) => get<FavoriteState>(`/me/favorites/${flightId}`)
export const addFavorite = (flightId: number) => write<FavoriteState>('POST', `/me/favorites/${flightId}`)
export const removeFavorite = (flightId: number) => remove(`/me/favorites/${flightId}`)
export const getSavedLocations = () => get<Location[]>('/me/saved-locations')
export const saveLocation = (locationId: number) => write<SavedState>('POST', `/me/saved-locations/${locationId}`)
export const unsaveLocation = (locationId: number) => remove(`/me/saved-locations/${locationId}`)

// ---- flights and places
export interface FlightQuery {
  direction?: Direction
  status?: FlightStatus
  date?: string
  origin?: string
  destination?: string
  q?: string
  page?: number
  pageSize?: number
}
export const getFlights = (query: FlightQuery = {}) => get<FlightPage>('/flights', { ...query })
export const getFlight = (id: number) => get<FlightDetail>(`/flights/${id}`)
export const getLocations = (query: { type?: LocationType; level?: number; q?: string } = {}) => get<Location[]>('/locations', query)
export const getLocation = (id: number) => get<LocationDetail>(`/locations/${id}`)
export const getShops = (category?: ShopCategory) => get<Location[]>('/shops', { category })
export const search = (q: string) => get<SearchResult>('/search', { q })
export const getOffers = () => get<Offer[]>('/offers')
export const getRoute = (toLocationId: number) => get<Route>('/navigation/route', { toLocationId })

// ---- admin
export const getAdminStats = () => get<AdminStats>('/admin/stats')
export const getAdminAirlines = () => get<Airline[]>('/admin/airlines')

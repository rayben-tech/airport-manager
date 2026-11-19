"""Pydantic v2 schemas (camelCase JSON) and the serializers that build them from ORM objects."""

import re
from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import joinedload, selectinload

from . import models as m

UserRole = Literal["passenger", "employee", "admin"]
LoyaltyTier = Literal["standard", "premium"]
LocationType = Literal["gate", "shop", "service", "baggage_belt", "checkpoint", "entrance"]
ShopCategory = Literal["restaurant", "boutique", "service"]
Direction = Literal["departure", "arrival"]
FlightStatus = Literal["on_time", "delayed", "boarding", "departed", "landed", "cancelled"]
CabinClass = Literal["economy", "business", "first"]
BookingStatus = Literal["confirmed", "completed", "cancelled"]
BagType = Literal["cabin", "checked"]
BagStatus = Literal["registered", "screened", "loaded", "delivered"]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------- auth / users
class UserOut(Camel):
    id: int
    email: str
    first_name: str
    last_name: str
    user_role: UserRole
    created_at: datetime


class LoginIn(Camel):
    email: str = Field(min_length=3, max_length=190)
    password: str = Field(min_length=1, max_length=200)


class RegisterIn(Camel):
    email: str = Field(max_length=190)
    password: str = Field(min_length=8, max_length=72)
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    phone: str | None = Field(default=None, max_length=20)
    nationality: str | None = Field(default=None, max_length=60)

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Adresse email invalide.")
        return v

    @field_validator("password")
    @classmethod
    def bcrypt_limit(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Le mot de passe ne doit pas dépasser 72 octets.")
        return v


class TokenOut(Camel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


# ---------------------------------------------------------------- reference data
class AirlineOut(Camel):
    id: int
    iata_code: str
    name: str
    brand_color: str


class AirportOut(Camel):
    id: int
    iata_code: str
    name: str
    city: str
    country: str


class AircraftModelOut(Camel):
    id: int
    name: str
    seats: int


class AircraftOut(Camel):
    id: int
    registration: str
    model: AircraftModelOut


class TerminalOut(Camel):
    id: int
    name: str
    terminal_code: str


# ---------------------------------------------------------------- places
class ShopInfo(Camel):
    category: ShopCategory
    opens_at: time
    closes_at: time
    is_open_now: bool


class LocationOut(Camel):
    id: int
    slug: str
    name: str
    location_type: LocationType
    floor_level: int
    x: int
    y: int
    description: str | None
    node_id: int | None
    terminal: TerminalOut
    gate_code: str | None = None
    belt_number: int | None = None
    shop: ShopInfo | None = None


class GateOut(Camel):
    id: int
    gate_code: str
    location: LocationOut


class BeltOut(Camel):
    id: int
    belt_number: int
    location_id: int


# ---------------------------------------------------------------- flights
class FlightSummary(Camel):
    id: int
    flight_number: str
    direction: Direction
    status: FlightStatus
    departs_at: datetime
    arrives_at: datetime
    boarding_at: datetime | None
    duration_minutes: int
    airline: AirlineOut
    origin: AirportOut
    destination: AirportOut
    gate_code: str | None
    terminal_name: str | None
    arrival_terminal: str | None
    belt_number: int | None


class FlightDetail(FlightSummary):
    aircraft: AircraftOut | None
    gate: GateOut | None
    terminal: TerminalOut | None
    baggage_belt: BeltOut | None


class FlightPage(Camel):
    items: list[FlightSummary]
    total: int
    page: int
    page_size: int


class LocationDetail(LocationOut):
    upcoming_flights: list[FlightSummary] = []


class SearchOut(Camel):
    flights: list[FlightSummary]
    shops: list[LocationOut]
    gates: list[LocationOut]


class OfferOut(Camel):
    id: int
    price_mad: float
    image_path: str
    display_order: int
    destination: AirportOut


# ---------------------------------------------------------------- me
class PassengerStats(Camel):
    completed_flights: int
    confirmed_reservations: int
    cancelled_bookings: int


class ProfileOut(UserOut):
    phone: str | None
    nationality: str | None
    loyalty_tier: LoyaltyTier | None
    rating: float | None
    stats: PassengerStats


class ProfileUpdate(Camel):
    first_name: str | None = Field(default=None, min_length=1, max_length=60)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    phone: str | None = Field(default=None, max_length=20)
    nationality: str | None = Field(default=None, max_length=60)


class BaggageItemOut(Camel):
    id: int
    bag_type: BagType
    label: str | None
    weight_kg: float
    size_cm: str | None
    tag_number: str
    status: BagStatus


class BookingOut(Camel):
    id: int
    booking_ref: str
    seat: str | None
    cabin_class: CabinClass
    status: BookingStatus
    ticket_code: str
    checked_in_at: datetime | None
    created_at: datetime
    flight: FlightSummary
    baggage_items: list[BaggageItemOut]


class BaggageOut(Camel):
    flight: FlightSummary | None
    booking_ref: str | None
    belt_number: int | None
    items: list[BaggageItemOut]


class FavoriteState(Camel):
    flight_id: int
    is_favorite: bool


class SavedState(Camel):
    location_id: int
    is_saved: bool


class NotificationOut(Camel):
    id: int
    title: str
    body: str
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------- navigation
class RoutePoint(Camel):
    x: int
    y: int
    floor_level: int


class RouteOut(Camel):
    from_node_id: int
    to_location_id: int
    points: list[RoutePoint]
    distance_meters: int
    minutes: int
    changes_level: bool
    note: str | None


# ---------------------------------------------------------------- admin
class StatusShare(Camel):
    status: FlightStatus
    count: int
    percent: float


class GateUsage(Camel):
    gate_code: str
    departures: int


class AdminStats(Camel):
    date: date
    total: int
    departures: int
    arrivals: int
    delayed: int
    cancelled: int
    status_distribution: list[StatusShare]
    top_gates: list[GateUsage]


class AirlineIn(Camel):
    iata_code: str = Field(min_length=2, max_length=2)
    name: str = Field(min_length=1, max_length=80)
    brand_color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class AirlineUpdate(Camel):
    iata_code: str | None = Field(default=None, min_length=2, max_length=2)
    name: str | None = Field(default=None, min_length=1, max_length=80)
    brand_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")


class AircraftAdminOut(Camel):
    id: int
    registration: str
    model_id: int
    airline_id: int


class AircraftIn(Camel):
    registration: str = Field(min_length=2, max_length=10)
    model_id: int
    airline_id: int


class AircraftUpdate(Camel):
    registration: str | None = Field(default=None, min_length=2, max_length=10)
    model_id: int | None = None
    airline_id: int | None = None


class GateAdminOut(Camel):
    id: int
    gate_code: str
    location_id: int


class GateIn(Camel):
    gate_code: str = Field(min_length=1, max_length=5)
    location_id: int


class GateUpdate(Camel):
    gate_code: str | None = Field(default=None, min_length=1, max_length=5)
    location_id: int | None = None


class TerminalIn(Camel):
    name: str = Field(min_length=1, max_length=60)
    terminal_code: str = Field(min_length=1, max_length=10)


class TerminalUpdate(Camel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    terminal_code: str | None = Field(default=None, min_length=1, max_length=10)


class ShopAdminOut(Camel):
    id: int
    location_id: int
    category: ShopCategory
    opens_at: time
    closes_at: time


class ShopIn(Camel):
    location_id: int
    category: ShopCategory
    opens_at: time
    closes_at: time

    @model_validator(mode="after")
    def hours(self) -> "ShopIn":
        if self.closes_at <= self.opens_at:
            raise ValueError("L'heure de fermeture doit être après l'heure d'ouverture.")
        return self


class ShopUpdate(Camel):
    location_id: int | None = None
    category: ShopCategory | None = None
    opens_at: time | None = None
    closes_at: time | None = None


class FlightAdminOut(Camel):
    id: int
    flight_number: str
    airline_id: int
    aircraft_id: int | None
    direction: Direction
    origin_airport_id: int
    destination_airport_id: int
    departs_at: datetime
    arrives_at: datetime
    boarding_at: datetime | None
    duration_minutes: int
    status: FlightStatus
    gate_id: int | None
    arrival_terminal: str | None
    baggage_belt_id: int | None


class FlightIn(Camel):
    flight_number: str = Field(min_length=2, max_length=8)
    airline_id: int
    aircraft_id: int | None = None
    direction: Direction
    origin_airport_id: int
    destination_airport_id: int
    departs_at: datetime
    arrives_at: datetime
    boarding_at: datetime | None = None
    status: FlightStatus = "on_time"
    gate_id: int | None = None
    arrival_terminal: str | None = Field(default=None, max_length=40)
    baggage_belt_id: int | None = None

    @model_validator(mode="after")
    def coherent(self) -> "FlightIn":
        if self.arrives_at <= self.departs_at:
            raise ValueError("L'arrivée doit être après le départ.")
        if self.origin_airport_id == self.destination_airport_id:
            raise ValueError("L'aéroport de départ et d'arrivée doivent être différents.")
        return self


class FlightUpdate(Camel):
    flight_number: str | None = Field(default=None, min_length=2, max_length=8)
    airline_id: int | None = None
    aircraft_id: int | None = None
    direction: Direction | None = None
    origin_airport_id: int | None = None
    destination_airport_id: int | None = None
    departs_at: datetime | None = None
    arrives_at: datetime | None = None
    boarding_at: datetime | None = None
    status: FlightStatus | None = None
    gate_id: int | None = None
    arrival_terminal: str | None = Field(default=None, max_length=40)
    baggage_belt_id: int | None = None


class AdminUserOut(UserOut):
    loyalty_tier: LoyaltyTier | None = None
    job_title: str | None = None


# ---------------------------------------------------------------- eager loading + serializers (no N+1 queries)
def flight_load_options(detail: bool = False) -> list:
    opts = [
        joinedload(m.Flight.airline),
        joinedload(m.Flight.origin),
        joinedload(m.Flight.destination),
        joinedload(m.Flight.gate).joinedload(m.Gate.location).joinedload(m.Location.terminal),
        joinedload(m.Flight.baggage_belt),
    ]
    if detail:
        opts.append(joinedload(m.Flight.aircraft).joinedload(m.Aircraft.model))
    return opts


def location_load_options() -> list:
    return [joinedload(m.Location.terminal), joinedload(m.Location.gate), joinedload(m.Location.shop), joinedload(m.Location.belt)]


def flight_summary(f: m.Flight) -> FlightSummary:
    gate_location = f.gate.location if f.gate else None
    return FlightSummary(
        id=f.id, flight_number=f.flight_number, direction=f.direction, status=f.status, departs_at=f.departs_at,
        arrives_at=f.arrives_at, boarding_at=f.boarding_at, duration_minutes=f.duration_minutes,
        airline=AirlineOut.model_validate(f.airline), origin=AirportOut.model_validate(f.origin),
        destination=AirportOut.model_validate(f.destination), gate_code=f.gate.gate_code if f.gate else None,
        terminal_name=gate_location.terminal.name if gate_location else None, arrival_terminal=f.arrival_terminal,
        belt_number=f.baggage_belt.belt_number if f.baggage_belt else None,
    )


def location_out(loc: m.Location, now: datetime, cls: type[LocationOut] = LocationOut, **extra: object) -> LocationOut:
    shop = None
    if loc.shop:
        t = now.time()
        shop = ShopInfo(category=loc.shop.category, opens_at=loc.shop.opens_at, closes_at=loc.shop.closes_at,
                        is_open_now=loc.shop.opens_at <= t < loc.shop.closes_at)
    return cls(
        id=loc.id, slug=loc.slug, name=loc.name, location_type=loc.location_type, floor_level=loc.floor_level, x=loc.x, y=loc.y,
        description=loc.description, node_id=loc.node_id, terminal=TerminalOut.model_validate(loc.terminal),
        gate_code=loc.gate.gate_code if loc.gate else None, belt_number=loc.belt.belt_number if loc.belt else None, shop=shop, **extra,
    )


def flight_detail(f: m.Flight, now: datetime) -> FlightDetail:
    base = flight_summary(f).model_dump()
    gate = None
    if f.gate:
        gate = GateOut(id=f.gate.id, gate_code=f.gate.gate_code, location=location_out(f.gate.location, now))
    return FlightDetail(
        **base,
        aircraft=AircraftOut.model_validate(f.aircraft) if f.aircraft else None,
        gate=gate,
        terminal=TerminalOut.model_validate(f.gate.location.terminal) if f.gate else None,
        baggage_belt=BeltOut.model_validate(f.baggage_belt) if f.baggage_belt else None,
    )


def booking_out(b: m.Booking) -> BookingOut:
    return BookingOut(
        id=b.id, booking_ref=b.booking_ref, seat=b.seat, cabin_class=b.cabin_class, status=b.status, ticket_code=b.ticket_code,
        checked_in_at=b.checked_in_at, created_at=b.created_at, flight=flight_summary(b.flight),
        baggage_items=[BaggageItemOut.model_validate(i) for i in b.baggage_items],
    )

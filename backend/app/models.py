"""ORM mapping of database/01_schema.sql (same tables, columns, types, enums and keys). Read and write only."""

from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import CHAR, DATE, DATETIME, DECIMAL, TIME, VARCHAR, Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.mysql import INTEGER, SMALLINT, TINYINT
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

UINT = INTEGER(unsigned=True)
USMALL = SMALLINT(unsigned=True)
UTINY = TINYINT(unsigned=True)

USER_ROLES = ("passenger", "employee", "admin")
LOYALTY_TIERS = ("standard", "premium")
NODE_KINDS = ("corridor", "hall", "entrance", "elevator", "stairs", "security")
LOCATION_TYPES = ("gate", "shop", "service", "baggage_belt", "checkpoint", "entrance")
SHOP_CATEGORIES = ("restaurant", "boutique", "service")
DIRECTIONS = ("departure", "arrival")
FLIGHT_STATUSES = ("on_time", "delayed", "boarding", "departed", "landed", "cancelled")
CABIN_CLASSES = ("economy", "business", "first")
BOOKING_STATUSES = ("confirmed", "completed", "cancelled")
BAG_TYPES = ("cabin", "checked")
BAG_STATUSES = ("registered", "screened", "loaded", "delivered")


def enum(*values: str) -> Enum:
    return Enum(*values, native_enum=True, create_constraint=False, validate_strings=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(VARCHAR(190), unique=True)
    password_hash: Mapped[str] = mapped_column(CHAR(60))
    first_name: Mapped[str] = mapped_column(VARCHAR(60))
    last_name: Mapped[str] = mapped_column(VARCHAR(60))
    user_role: Mapped[str] = mapped_column(enum(*USER_ROLES), default="passenger")
    created_at: Mapped[datetime] = mapped_column(DATETIME)

    passenger: Mapped["Passenger | None"] = relationship(back_populates="user", uselist=False)
    employee: Mapped["Employee | None"] = relationship(back_populates="user", uselist=False)


class Terminal(Base):
    __tablename__ = "terminals"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(VARCHAR(60))
    terminal_code: Mapped[str] = mapped_column(VARCHAR(10), unique=True)


class Passenger(Base):
    __tablename__ = "passengers"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    phone: Mapped[str | None] = mapped_column(VARCHAR(20))
    nationality: Mapped[str | None] = mapped_column(VARCHAR(60))
    loyalty_tier: Mapped[str] = mapped_column(enum(*LOYALTY_TIERS), default="standard")
    rating: Mapped[Decimal | None] = mapped_column(DECIMAL(2, 1))

    user: Mapped[User] = relationship(back_populates="passenger")


class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    job_title: Mapped[str] = mapped_column(VARCHAR(80))
    terminal_id: Mapped[int | None] = mapped_column(UINT, ForeignKey("terminals.id", ondelete="SET NULL"))
    hired_at: Mapped[date] = mapped_column(DATE)

    user: Mapped[User] = relationship(back_populates="employee")
    terminal: Mapped[Terminal | None] = relationship()


class Airline(Base):
    __tablename__ = "airlines"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    iata_code: Mapped[str] = mapped_column(CHAR(2), unique=True)
    name: Mapped[str] = mapped_column(VARCHAR(80))
    brand_color: Mapped[str] = mapped_column(CHAR(7))


class AircraftModel(Base):
    __tablename__ = "aircraft_models"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(VARCHAR(60), unique=True)
    seats: Mapped[int] = mapped_column(USMALL)


class Aircraft(Base):
    __tablename__ = "aircraft"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    registration: Mapped[str] = mapped_column(VARCHAR(10), unique=True)
    model_id: Mapped[int] = mapped_column(UINT, ForeignKey("aircraft_models.id", ondelete="RESTRICT"))
    airline_id: Mapped[int] = mapped_column(UINT, ForeignKey("airlines.id", ondelete="RESTRICT"))

    model: Mapped[AircraftModel] = relationship()
    airline: Mapped[Airline] = relationship()


class Airport(Base):
    __tablename__ = "airports"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    iata_code: Mapped[str] = mapped_column(CHAR(3), unique=True)
    name: Mapped[str] = mapped_column(VARCHAR(120))
    city: Mapped[str] = mapped_column(VARCHAR(80))
    country: Mapped[str] = mapped_column(VARCHAR(80))


class MapNode(Base):
    __tablename__ = "map_nodes"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    floor_level: Mapped[int] = mapped_column(UTINY)
    x: Mapped[int] = mapped_column(USMALL)
    y: Mapped[int] = mapped_column(USMALL)
    kind: Mapped[str] = mapped_column(enum(*NODE_KINDS))
    label: Mapped[str | None] = mapped_column(VARCHAR(80))


class MapEdge(Base):
    __tablename__ = "map_edges"
    __table_args__ = (UniqueConstraint("node_a_id", "node_b_id", name="uq_map_edges_pair"),)
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    node_a_id: Mapped[int] = mapped_column(UINT, ForeignKey("map_nodes.id", ondelete="CASCADE"))
    node_b_id: Mapped[int] = mapped_column(UINT, ForeignKey("map_nodes.id", ondelete="CASCADE"))
    weight: Mapped[Decimal] = mapped_column(DECIMAL(8, 2))


class Location(Base):
    __tablename__ = "locations"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(VARCHAR(40), unique=True)
    name: Mapped[str] = mapped_column(VARCHAR(120))
    location_type: Mapped[str] = mapped_column(enum(*LOCATION_TYPES))
    terminal_id: Mapped[int] = mapped_column(UINT, ForeignKey("terminals.id", ondelete="RESTRICT"))
    floor_level: Mapped[int] = mapped_column(UTINY)
    x: Mapped[int] = mapped_column(USMALL)
    y: Mapped[int] = mapped_column(USMALL)
    description: Mapped[str | None] = mapped_column(VARCHAR(255))
    node_id: Mapped[int | None] = mapped_column(UINT, ForeignKey("map_nodes.id", ondelete="SET NULL"))

    terminal: Mapped[Terminal] = relationship()
    node: Mapped[MapNode | None] = relationship()
    gate: Mapped["Gate | None"] = relationship(back_populates="location", uselist=False)
    shop: Mapped["Shop | None"] = relationship(back_populates="location", uselist=False)
    belt: Mapped["BaggageBelt | None"] = relationship(back_populates="location", uselist=False)


class Gate(Base):
    __tablename__ = "gates"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    gate_code: Mapped[str] = mapped_column(VARCHAR(5), unique=True)
    location_id: Mapped[int] = mapped_column(UINT, ForeignKey("locations.id", ondelete="CASCADE"), unique=True)

    location: Mapped[Location] = relationship(back_populates="gate")


class Shop(Base):
    __tablename__ = "shops"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    location_id: Mapped[int] = mapped_column(UINT, ForeignKey("locations.id", ondelete="CASCADE"), unique=True)
    category: Mapped[str] = mapped_column(enum(*SHOP_CATEGORIES))
    opens_at: Mapped[time] = mapped_column(TIME)
    closes_at: Mapped[time] = mapped_column(TIME)

    location: Mapped[Location] = relationship(back_populates="shop")


class BaggageBelt(Base):
    __tablename__ = "baggage_belts"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    belt_number: Mapped[int] = mapped_column(UTINY, unique=True)
    location_id: Mapped[int] = mapped_column(UINT, ForeignKey("locations.id", ondelete="CASCADE"), unique=True)

    location: Mapped[Location] = relationship(back_populates="belt")


class Flight(Base):
    __tablename__ = "flights"
    __table_args__ = (UniqueConstraint("flight_number", "departs_at", name="uq_flights_number_departure"),)
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    flight_number: Mapped[str] = mapped_column(VARCHAR(8))
    airline_id: Mapped[int] = mapped_column(UINT, ForeignKey("airlines.id", ondelete="RESTRICT"))
    aircraft_id: Mapped[int | None] = mapped_column(UINT, ForeignKey("aircraft.id", ondelete="SET NULL"))
    direction: Mapped[str] = mapped_column(enum(*DIRECTIONS))
    origin_airport_id: Mapped[int] = mapped_column(UINT, ForeignKey("airports.id", ondelete="RESTRICT"))
    destination_airport_id: Mapped[int] = mapped_column(UINT, ForeignKey("airports.id", ondelete="RESTRICT"))
    departs_at: Mapped[datetime] = mapped_column(DATETIME)
    arrives_at: Mapped[datetime] = mapped_column(DATETIME)
    boarding_at: Mapped[datetime | None] = mapped_column(DATETIME)
    duration_minutes: Mapped[int] = mapped_column(USMALL)
    status: Mapped[str] = mapped_column(enum(*FLIGHT_STATUSES), default="on_time")
    gate_id: Mapped[int | None] = mapped_column(UINT, ForeignKey("gates.id", ondelete="SET NULL"))
    arrival_terminal: Mapped[str | None] = mapped_column(VARCHAR(40))
    baggage_belt_id: Mapped[int | None] = mapped_column(UINT, ForeignKey("baggage_belts.id", ondelete="SET NULL"))

    airline: Mapped[Airline] = relationship()
    aircraft: Mapped[Aircraft | None] = relationship()
    origin: Mapped[Airport] = relationship(foreign_keys=[origin_airport_id])
    destination: Mapped[Airport] = relationship(foreign_keys=[destination_airport_id])
    gate: Mapped[Gate | None] = relationship()
    baggage_belt: Mapped[BaggageBelt | None] = relationship()


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("user_id", "flight_id", name="uq_bookings_user_flight"),)
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    booking_ref: Mapped[str] = mapped_column(CHAR(6), unique=True)
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"))
    flight_id: Mapped[int] = mapped_column(UINT, ForeignKey("flights.id", ondelete="RESTRICT"))
    seat: Mapped[str | None] = mapped_column(VARCHAR(4))
    cabin_class: Mapped[str] = mapped_column(enum(*CABIN_CLASSES), default="economy")
    status: Mapped[str] = mapped_column(enum(*BOOKING_STATUSES), default="confirmed")
    ticket_code: Mapped[str] = mapped_column(VARCHAR(20), unique=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(DATETIME)
    created_at: Mapped[datetime] = mapped_column(DATETIME)

    flight: Mapped[Flight] = relationship()
    baggage_items: Mapped[list["BaggageItem"]] = relationship(back_populates="booking", order_by="BaggageItem.id")


class BaggageItem(Base):
    __tablename__ = "baggage_items"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(UINT, ForeignKey("bookings.id", ondelete="CASCADE"))
    bag_type: Mapped[str] = mapped_column(enum(*BAG_TYPES))
    label: Mapped[str | None] = mapped_column(VARCHAR(60))
    weight_kg: Mapped[Decimal] = mapped_column(DECIMAL(4, 1))
    size_cm: Mapped[str | None] = mapped_column(VARCHAR(20))
    tag_number: Mapped[str] = mapped_column(VARCHAR(20), unique=True)
    status: Mapped[str] = mapped_column(enum(*BAG_STATUSES), default="registered")

    booking: Mapped[Booking] = relationship(back_populates="baggage_items")


class FavoriteFlight(Base):
    __tablename__ = "favorite_flights"
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    flight_id: Mapped[int] = mapped_column(UINT, ForeignKey("flights.id", ondelete="CASCADE"), primary_key=True)

    flight: Mapped[Flight] = relationship()


class SavedLocation(Base):
    __tablename__ = "saved_locations"
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    location_id: Mapped[int] = mapped_column(UINT, ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True)

    location: Mapped[Location] = relationship()


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(UINT, ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(VARCHAR(120))
    body: Mapped[str] = mapped_column(VARCHAR(255))
    is_read: Mapped[bool] = mapped_column(Boolean(create_constraint=False), default=False)
    created_at: Mapped[datetime] = mapped_column(DATETIME)


class Offer(Base):
    __tablename__ = "offers"
    id: Mapped[int] = mapped_column(UINT, primary_key=True, autoincrement=True)
    destination_airport_id: Mapped[int] = mapped_column(UINT, ForeignKey("airports.id", ondelete="RESTRICT"))
    price_mad: Mapped[Decimal] = mapped_column(DECIMAL(8, 2))
    image_path: Mapped[str] = mapped_column(VARCHAR(120))
    display_order: Mapped[int] = mapped_column(UTINY)
    is_active: Mapped[bool] = mapped_column(Boolean(create_constraint=False), default=True)

    destination: Mapped[Airport] = relationship()

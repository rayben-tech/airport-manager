from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import joinedload, selectinload

from ..deps import CurrentUser, DbSession, Now
from ..models import Booking, FavoriteFlight, Flight, Location, Notification, Passenger, SavedLocation
from ..schemas import (BaggageItemOut, BaggageOut, BookingOut, FavoriteState, FlightSummary, LocationOut, NotificationOut, PassengerStats,
                       ProfileOut, ProfileUpdate, SavedState, booking_out, flight_load_options, flight_summary, location_load_options,
                       location_out)

router = APIRouter(prefix="/me", tags=["Espace passager"])

BOOKING_FILTER = {"upcoming": "confirmed", "past": "completed", "cancelled": "cancelled"}


def booking_options() -> list:
    return [joinedload(Booking.flight).options(*flight_load_options()), selectinload(Booking.baggage_items)]


def _profile(db: DbSession, user: CurrentUser) -> ProfileOut:
    passenger = db.scalar(select(Passenger).where(Passenger.user_id == user.id))
    completed, confirmed, cancelled = db.execute(
        select(func.coalesce(func.sum(case((Booking.status == "completed", 1), else_=0)), 0),
               func.coalesce(func.sum(case((Booking.status == "confirmed", 1), else_=0)), 0),
               func.coalesce(func.sum(case((Booking.status == "cancelled", 1), else_=0)), 0)).where(Booking.user_id == user.id)
    ).one()
    return ProfileOut(
        id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name, user_role=user.user_role, created_at=user.created_at,
        phone=passenger.phone if passenger else None, nationality=passenger.nationality if passenger else None,
        loyalty_tier=passenger.loyalty_tier if passenger else None,
        rating=float(passenger.rating) if passenger and passenger.rating is not None else None,
        stats=PassengerStats(completed_flights=int(completed), confirmed_reservations=int(confirmed), cancelled_bookings=int(cancelled)),
    )


@router.get("", response_model=ProfileOut, summary="Profil et statistiques")
def get_profile(db: DbSession, user: CurrentUser) -> ProfileOut:
    return _profile(db, user)


@router.put("", response_model=ProfileOut, summary="Modifier le profil")
def update_profile(payload: ProfileUpdate, db: DbSession, user: CurrentUser) -> ProfileOut:
    data = payload.model_dump(exclude_unset=True)
    for field in ("first_name", "last_name"):
        if data.get(field):
            setattr(user, field, data[field].strip())
    if "phone" in data or "nationality" in data:
        passenger = db.scalar(select(Passenger).where(Passenger.user_id == user.id))
        if passenger is None:
            passenger = Passenger(user_id=user.id, loyalty_tier="standard")
            db.add(passenger)
        for field in ("phone", "nationality"):
            if field in data:
                setattr(passenger, field, data[field])
    db.commit()
    return _profile(db, user)


def _next_booking(db: DbSession, user: CurrentUser, now: Now) -> Booking | None:
    return db.scalar(
        select(Booking).join(Booking.flight)
        .where(Booking.user_id == user.id, Booking.status == "confirmed", Flight.departs_at >= now)
        .order_by(Flight.departs_at).limit(1).options(*booking_options())
    )


@router.get("/next-flight", response_model=BookingOut, summary="Prochain vol")
def next_flight(db: DbSession, user: CurrentUser, now: Now) -> BookingOut:
    booking = _next_booking(db, user, now)
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aucun vol à venir.")
    return booking_out(booking)


@router.get("/bookings", response_model=list[BookingOut], summary="Mes vols (à venir, passés, annulés)")
def my_bookings(
    db: DbSession,
    user: CurrentUser,
    status_: Literal["upcoming", "past", "cancelled"] = Query("upcoming", alias="status"),
) -> list[BookingOut]:
    stmt = select(Booking).join(Booking.flight).where(Booking.user_id == user.id, Booking.status == BOOKING_FILTER[status_])
    stmt = stmt.order_by(Flight.departs_at if status_ == "upcoming" else Flight.departs_at.desc())
    return [booking_out(b) for b in db.scalars(stmt.options(*booking_options())).unique().all()]


@router.get("/baggage", response_model=BaggageOut, summary="Bagages et tapis du prochain vol")
def my_baggage(db: DbSession, user: CurrentUser, now: Now) -> BaggageOut:
    booking = _next_booking(db, user, now)
    if booking is None:
        return BaggageOut(flight=None, booking_ref=None, belt_number=None, items=[])
    return BaggageOut(
        flight=flight_summary(booking.flight), booking_ref=booking.booking_ref,
        belt_number=booking.flight.baggage_belt.belt_number if booking.flight.baggage_belt else None,
        items=[BaggageItemOut.model_validate(i) for i in booking.baggage_items],
    )


@router.post("/bookings/{booking_id}/check-in", response_model=BookingOut, summary="Enregistrement en ligne")
def check_in(booking_id: int, db: DbSession, user: CurrentUser, now: Now) -> BookingOut:
    booking = db.scalar(select(Booking).where(Booking.id == booking_id, Booking.user_id == user.id).options(*booking_options()))
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Réservation introuvable.")
    if booking.status != "confirmed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Seule une réservation confirmée peut être enregistrée.")
    if booking.flight.status == "cancelled":
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce vol est annulé.")
    if booking.flight.departs_at <= now:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce vol est déjà parti.")
    if booking.checked_in_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Vous êtes déjà enregistré sur ce vol.")
    booking.checked_in_at = now.replace(microsecond=0)
    db.commit()
    return booking_out(booking)


# ---------------------------------------------------------------- favorites
@router.get("/favorites", response_model=list[FlightSummary], summary="Mes vols favoris")
def list_favorites(db: DbSession, user: CurrentUser) -> list[FlightSummary]:
    flights = db.scalars(select(Flight).join(FavoriteFlight, FavoriteFlight.flight_id == Flight.id)
                         .where(FavoriteFlight.user_id == user.id).order_by(Flight.departs_at).options(*flight_load_options())).unique().all()
    return [flight_summary(f) for f in flights]


@router.get("/favorites/{flight_id}", response_model=FavoriteState, summary="Ce vol est-il en favori ?")
def is_favorite(flight_id: int, db: DbSession, user: CurrentUser) -> FavoriteState:
    return FavoriteState(flight_id=flight_id, is_favorite=db.get(FavoriteFlight, (user.id, flight_id)) is not None)


@router.post("/favorites/{flight_id}", response_model=FavoriteState, status_code=status.HTTP_201_CREATED, summary="Ajouter aux favoris")
def add_favorite(flight_id: int, db: DbSession, user: CurrentUser) -> FavoriteState:
    if db.get(Flight, flight_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vol introuvable.")
    if db.get(FavoriteFlight, (user.id, flight_id)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce vol est déjà dans vos favoris.")
    db.add(FavoriteFlight(user_id=user.id, flight_id=flight_id))
    db.commit()
    return FavoriteState(flight_id=flight_id, is_favorite=True)


@router.delete("/favorites/{flight_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Retirer des favoris")
def remove_favorite(flight_id: int, db: DbSession, user: CurrentUser) -> Response:
    fav = db.get(FavoriteFlight, (user.id, flight_id))
    if fav is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ce vol n'est pas dans vos favoris.")
    db.delete(fav)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- saved locations
@router.get("/saved-locations", response_model=list[LocationOut], summary="Mes lieux enregistrés")
def list_saved(db: DbSession, user: CurrentUser, now: Now) -> list[LocationOut]:
    locs = db.scalars(select(Location).join(SavedLocation, SavedLocation.location_id == Location.id)
                      .where(SavedLocation.user_id == user.id).order_by(Location.name).options(*location_load_options())).unique().all()
    return [location_out(loc, now) for loc in locs]


@router.get("/saved-locations/{location_id}", response_model=SavedState, summary="Ce lieu est-il enregistré ?")
def is_saved(location_id: int, db: DbSession, user: CurrentUser) -> SavedState:
    return SavedState(location_id=location_id, is_saved=db.get(SavedLocation, (user.id, location_id)) is not None)


@router.post("/saved-locations/{location_id}", response_model=SavedState, status_code=status.HTTP_201_CREATED, summary="Enregistrer un lieu")
def save_location(location_id: int, db: DbSession, user: CurrentUser) -> SavedState:
    if db.get(Location, location_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lieu introuvable.")
    if db.get(SavedLocation, (user.id, location_id)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce lieu est déjà enregistré.")
    db.add(SavedLocation(user_id=user.id, location_id=location_id))
    db.commit()
    return SavedState(location_id=location_id, is_saved=True)


@router.delete("/saved-locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Retirer un lieu enregistré")
def unsave_location(location_id: int, db: DbSession, user: CurrentUser) -> Response:
    saved = db.get(SavedLocation, (user.id, location_id))
    if saved is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ce lieu n'est pas enregistré.")
    db.delete(saved)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- notifications
@router.get("/notifications", response_model=list[NotificationOut], summary="Mes notifications")
def list_notifications(db: DbSession, user: CurrentUser) -> list[Notification]:
    return list(db.scalars(select(Notification).where(Notification.user_id == user.id)
                           .order_by(Notification.is_read, Notification.created_at.desc())).all())


@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut, summary="Marquer comme lue")
def read_notification(notification_id: int, db: DbSession, user: CurrentUser) -> Notification:
    n = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if n is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification introuvable.")
    n.is_read = True
    db.commit()
    return n

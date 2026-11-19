from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, or_, select

from ..deps import DbSession, Now
from ..models import Flight, Gate, Location, Shop
from ..schemas import (LocationDetail, LocationOut, LocationType, SearchOut, ShopCategory, flight_load_options, flight_summary,
                       location_load_options, location_out)
from .flights import like, list_flights

router = APIRouter(tags=["Lieux"])


@router.get("/locations", response_model=list[LocationOut], summary="Lieux du plan (filtres type, niveau, recherche)")
def list_locations(
    db: DbSession,
    now: Now,
    type_: LocationType | None = Query(None, alias="type"),
    level: int | None = Query(None, ge=0, le=2, description="Niveau (0, 1 ou 2)"),
    q: str | None = Query(None, min_length=1, max_length=60),
) -> list[LocationOut]:
    stmt = select(Location).options(*location_load_options()).order_by(Location.floor_level.desc(), Location.name)
    if type_:
        stmt = stmt.where(Location.location_type == type_)
    if level is not None:
        stmt = stmt.where(Location.floor_level == level)
    if q:
        stmt = stmt.where(Location.name.like(like(q.strip())))
    return [location_out(loc, now) for loc in db.scalars(stmt).unique().all()]


@router.get("/locations/{location_id}", response_model=LocationDetail, summary="Détail d'un lieu (vols à venir pour une porte)")
def get_location(location_id: int, db: DbSession, now: Now) -> LocationDetail:
    loc = db.scalar(select(Location).where(Location.id == location_id).options(*location_load_options()))
    if loc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lieu introuvable.")
    upcoming = []
    if loc.gate:
        flights = db.scalars(
            select(Flight).where(
                Flight.gate_id == loc.gate.id,
                or_(and_(Flight.direction == "departure", Flight.departs_at >= now),
                    and_(Flight.direction == "arrival", Flight.arrives_at >= now)),
            ).order_by(Flight.departs_at).limit(10).options(*flight_load_options())
        ).unique().all()
        upcoming = [flight_summary(f) for f in flights]
    return location_out(loc, now, LocationDetail, upcoming_flights=upcoming)


@router.get("/shops", response_model=list[LocationOut], summary="Commerces, restaurants et services")
def list_shops(db: DbSession, now: Now, category: ShopCategory | None = None) -> list[LocationOut]:
    stmt = select(Location).join(Shop, Shop.location_id == Location.id).options(*location_load_options()).order_by(Location.name)
    if category:
        stmt = stmt.where(Shop.category == category)
    return [location_out(loc, now) for loc in db.scalars(stmt).unique().all()]


@router.get("/search", response_model=SearchOut, summary="Recherche globale (vols, commerces, portes)")
def search(db: DbSession, now: Now, q: str = Query(min_length=1, max_length=60)) -> SearchOut:
    pattern = like(q.strip())
    # same matching rules as GET /flights?q=
    flights = list_flights(db=db, direction=None, status_=None, day=None, origin=None, destination=None, q=q, page=1, page_size=10).items
    shops = db.scalars(select(Location).join(Shop, Shop.location_id == Location.id).where(Location.name.like(pattern))
                       .options(*location_load_options()).order_by(Location.name).limit(10)).unique().all()
    gates = db.scalars(select(Location).join(Gate, Gate.location_id == Location.id)
                       .where(or_(Gate.gate_code.like(pattern), Location.name.like(pattern)))
                       .options(*location_load_options()).order_by(Location.name).limit(10)).unique().all()
    return SearchOut(flights=flights, shops=[location_out(s, now) for s in shops], gates=[location_out(g, now) for g in gates])

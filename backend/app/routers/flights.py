from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import aliased

from ..deps import DbSession, Now
from ..models import Airline, Airport, Flight
from ..schemas import Direction, FlightDetail, FlightPage, FlightStatus, flight_detail, flight_load_options, flight_summary

router = APIRouter(prefix="/flights", tags=["Vols"])


def like(text: str) -> str:
    """LIKE pattern with % and _ escaped (the value is still sent as a bound parameter)."""
    return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def day_condition(day: date):
    """Departures by departure date, arrivals by arrival date (how the flight boards show a day)."""
    start, end = datetime.combine(day, time.min), datetime.combine(day + timedelta(days=1), time.min)
    return or_(
        and_(Flight.direction == "departure", Flight.departs_at >= start, Flight.departs_at < end),
        and_(Flight.direction == "arrival", Flight.arrives_at >= start, Flight.arrives_at < end),
    )


@router.get("", response_model=FlightPage, summary="Liste des vols (filtres et pagination)")
def list_flights(
    db: DbSession,
    direction: Direction | None = None,
    status_: FlightStatus | None = Query(None, alias="status"),
    day: date | None = Query(None, alias="date", description="Jour au format AAAA-MM-JJ"),
    origin: str | None = Query(None, min_length=3, max_length=3, description="Code IATA d'origine"),
    destination: str | None = Query(None, min_length=3, max_length=3, description="Code IATA de destination"),
    q: str | None = Query(None, min_length=1, max_length=60, description="Numéro de vol, compagnie, ville ou code IATA"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200, alias="pageSize"),
) -> FlightPage:
    org, dst = aliased(Airport), aliased(Airport)
    stmt = select(Flight).join(Flight.airline).join(org, Flight.origin_airport_id == org.id).join(dst, Flight.destination_airport_id == dst.id)
    if direction:
        stmt = stmt.where(Flight.direction == direction)
    if status_:
        stmt = stmt.where(Flight.status == status_)
    if day:
        stmt = stmt.where(day_condition(day))
    if origin:
        stmt = stmt.where(org.iata_code == origin.upper())
    if destination:
        stmt = stmt.where(dst.iata_code == destination.upper())
    if q:
        pattern = like(q.strip())
        stmt = stmt.where(or_(Flight.flight_number.like(pattern), Airline.name.like(pattern), org.city.like(pattern), dst.city.like(pattern),
                              org.iata_code.like(pattern), dst.iata_code.like(pattern), org.country.like(pattern), dst.country.like(pattern)))
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.options(*flight_load_options()).order_by(Flight.departs_at, Flight.id)
                      .offset((page - 1) * page_size).limit(page_size)).unique().all()
    return FlightPage(items=[flight_summary(f) for f in rows], total=total, page=page, page_size=page_size)


@router.get("/{flight_id}", response_model=FlightDetail, summary="Détail d'un vol")
def get_flight(flight_id: int, db: DbSession, now: Now) -> FlightDetail:
    f = db.scalar(select(Flight).where(Flight.id == flight_id).options(*flight_load_options(detail=True)))
    if f is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vol introuvable.")
    return flight_detail(f, now)

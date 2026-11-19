"""Admin endpoints (require_admin): dashboard stats computed from the database, CRUD and a read-only user list."""

from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..deps import DbSession, Now, require_admin
from ..models import FLIGHT_STATUSES, Aircraft, Airline, Base, Flight, Gate, Shop, Terminal, User
from ..schemas import (AdminStats, AdminUserOut, AircraftAdminOut, AircraftIn, AircraftUpdate, AirlineIn, AirlineOut, AirlineUpdate,
                       FlightAdminOut, FlightIn, FlightUpdate, GateAdminOut, GateIn, GateUpdate, GateUsage, ShopAdminOut, ShopIn, ShopUpdate,
                       StatusShare, TerminalIn, TerminalOut, TerminalUpdate)
from .flights import day_condition

router = APIRouter(prefix="/admin", tags=["Administration"], dependencies=[Depends(require_admin)])

MYSQL_ERRORS = {
    1062: (status.HTTP_409_CONFLICT, "Cette valeur existe déjà (doublon)."),
    1451: (status.HTTP_409_CONFLICT, "Suppression impossible : cet élément est utilisé par d'autres données."),
    1452: (status.HTTP_422_UNPROCESSABLE_ENTITY, "Référence inconnue : un identifiant lié n'existe pas."),
    3819: (status.HTTP_422_UNPROCESSABLE_ENTITY, "Valeur refusée par une contrainte de la base de données."),
}


def commit(db: Session) -> None:
    """Commit and turn MySQL integrity errors into clear HTTP errors."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        code = exc.orig.args[0] if exc.orig is not None and exc.orig.args else None
        http_status, message = MYSQL_ERRORS.get(code, (status.HTTP_409_CONFLICT, "Conflit avec les données existantes."))
        raise HTTPException(http_status, message) from None


# ---------------------------------------------------------------- stats
@router.get("/stats", response_model=AdminStats, summary="Tableau de bord (calculé depuis la base)")
def stats(db: DbSession, now: Now, day: date | None = Query(None, alias="date", description="Jour (par défaut : aujourd'hui)")) -> AdminStats:
    day = day or now.date()
    in_day = day_condition(day)
    rows = db.execute(select(Flight.direction, Flight.status, func.count()).where(in_day).group_by(Flight.direction, Flight.status)).all()
    total = sum(n for _, _, n in rows)
    by_status = {s: 0 for s in FLIGHT_STATUSES}
    for _, s, n in rows:
        by_status[s] += n
    distribution = [StatusShare(status=s, count=n, percent=round(n * 100 / total, 1) if total else 0.0) for s, n in by_status.items() if n]
    start, end = datetime.combine(day, time.min), datetime.combine(day + timedelta(days=1), time.min)
    top = db.execute(
        select(Gate.gate_code, func.count(Flight.id).label("departures"))
        .join(Flight, and_(Flight.gate_id == Gate.id, Flight.direction == "departure", Flight.departs_at >= start, Flight.departs_at < end))
        .group_by(Gate.id, Gate.gate_code).order_by(func.count(Flight.id).desc(), Gate.gate_code).limit(3)
    ).all()
    return AdminStats(
        date=day, total=total,
        departures=sum(n for d, _, n in rows if d == "departure"), arrivals=sum(n for d, _, n in rows if d == "arrival"),
        delayed=by_status["delayed"], cancelled=by_status["cancelled"], status_distribution=distribution,
        top_gates=[GateUsage(gate_code=code, departures=n) for code, n in top],
    )


# ---------------------------------------------------------------- generic CRUD
def crud(path: str, model: type[Base], create_schema: type[BaseModel], update_schema: type[BaseModel], out: type[BaseModel],
         label: str, order_by, before_save=None) -> None:
    """GET list, GET one, POST, PUT (partial) and DELETE for one table."""

    def get_or_404(db: Session, item_id: int):
        obj = db.get(model, item_id)
        if obj is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{label} introuvable.")
        return obj

    def list_items(db: DbSession):
        return list(db.scalars(select(model).order_by(order_by)).all())

    def get_item(item_id: int, db: DbSession):
        return get_or_404(db, item_id)

    def create_item(payload: create_schema, db: DbSession):  # type: ignore[valid-type]
        obj = model(**payload.model_dump())
        if before_save:
            before_save(obj)
        db.add(obj)
        commit(db)
        db.refresh(obj)
        return obj

    def update_item(item_id: int, payload: update_schema, db: DbSession):  # type: ignore[valid-type]
        obj = get_or_404(db, item_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, key, value)
        if before_save:
            before_save(obj)
        commit(db)
        db.refresh(obj)
        return obj

    def delete_item(item_id: int, db: DbSession) -> Response:
        db.delete(get_or_404(db, item_id))
        commit(db)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    name = path.replace("-", "_")
    router.add_api_route(f"/{path}", list_items, methods=["GET"], response_model=list[out], name=f"list_{name}", summary=f"Lister : {label}")
    router.add_api_route(f"/{path}/{{item_id}}", get_item, methods=["GET"], response_model=out, name=f"get_{name}", summary=f"Lire : {label}")
    router.add_api_route(f"/{path}", create_item, methods=["POST"], response_model=out, status_code=201, name=f"create_{name}",
                         summary=f"Créer : {label}")
    router.add_api_route(f"/{path}/{{item_id}}", update_item, methods=["PUT"], response_model=out, name=f"update_{name}",
                         summary=f"Modifier : {label}")
    router.add_api_route(f"/{path}/{{item_id}}", delete_item, methods=["DELETE"], status_code=204, name=f"delete_{name}",
                         summary=f"Supprimer : {label}")


def check_flight(f: Flight) -> None:
    if f.arrives_at <= f.departs_at:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "L'arrivée doit être après le départ.")
    if f.origin_airport_id == f.destination_airport_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "L'aéroport de départ et d'arrivée doivent être différents.")
    f.duration_minutes = int((f.arrives_at - f.departs_at).total_seconds() // 60)


def check_shop(s: Shop) -> None:
    if s.closes_at <= s.opens_at:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "L'heure de fermeture doit être après l'heure d'ouverture.")


crud("flights", Flight, FlightIn, FlightUpdate, FlightAdminOut, "Vol", Flight.departs_at, before_save=check_flight)
crud("airlines", Airline, AirlineIn, AirlineUpdate, AirlineOut, "Compagnie", Airline.name)
crud("aircraft", Aircraft, AircraftIn, AircraftUpdate, AircraftAdminOut, "Avion", Aircraft.registration)
crud("gates", Gate, GateIn, GateUpdate, GateAdminOut, "Porte", Gate.gate_code)
crud("terminals", Terminal, TerminalIn, TerminalUpdate, TerminalOut, "Terminal", Terminal.terminal_code)
crud("shops", Shop, ShopIn, ShopUpdate, ShopAdminOut, "Commerce", Shop.id, before_save=check_shop)


# ---------------------------------------------------------------- users (read only, never the password hash)
@router.get("/users", response_model=list[AdminUserOut], summary="Utilisateurs (lecture seule)")
def list_users(db: DbSession) -> list[AdminUserOut]:
    users = db.scalars(select(User).options(selectinload(User.passenger), selectinload(User.employee)).order_by(User.id)).all()
    return [
        AdminUserOut(id=u.id, email=u.email, first_name=u.first_name, last_name=u.last_name, user_role=u.user_role, created_at=u.created_at,
                     loyalty_tier=u.passenger.loyalty_tier if u.passenger else None, job_title=u.employee.job_title if u.employee else None)
        for u in users
    ]

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..deps import DbSession
from ..models import Offer
from ..schemas import OfferOut

router = APIRouter(prefix="/offers", tags=["Offres"])


@router.get("", response_model=list[OfferOut], summary="Offres populaires actives")
def list_offers(db: DbSession) -> list[Offer]:
    stmt = select(Offer).where(Offer.is_active.is_(True)).options(joinedload(Offer.destination)).order_by(Offer.display_order, Offer.id)
    return list(db.scalars(stmt).all())

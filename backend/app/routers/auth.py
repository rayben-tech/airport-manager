from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..deps import CurrentUser, DbSession, Now
from ..models import Passenger, User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentification"])


def _token_for(user: User) -> TokenOut:
    token, expires_in = create_access_token(user.id, user.user_role)
    return TokenOut(access_token=token, expires_in=expires_in, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut, summary="Connexion (email + mot de passe)")
def login(payload: LoginIn, db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou mot de passe incorrect.")
    return _token_for(user)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED, summary="Créer un compte passager")
def register(payload: RegisterIn, db: DbSession, now: Now) -> TokenOut:
    if db.scalar(select(User.id).where(User.email == payload.email)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Un compte existe déjà avec cet email.")
    user = User(email=payload.email, password_hash=hash_password(payload.password), first_name=payload.first_name.strip(),
                last_name=payload.last_name.strip(), user_role="passenger", created_at=now.replace(microsecond=0))
    db.add(user)
    db.flush()
    db.add(Passenger(user_id=user.id, phone=payload.phone, nationality=payload.nationality, loyalty_tier="standard"))
    db.commit()
    return _token_for(user)


@router.get("/me", response_model=UserOut, summary="Utilisateur connecté")
def me(user: CurrentUser) -> User:
    return user

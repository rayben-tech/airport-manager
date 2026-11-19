"""Shared FastAPI dependencies: database session, current user, roles, clock."""

from datetime import datetime
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import User
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False, description="Jeton JWT obtenu avec POST /api/auth/login")

DbSession = Annotated[Session, Depends(get_db)]


def get_now() -> datetime:
    return get_settings().now()


Now = Annotated[datetime, Depends(get_now)]


def require_user(db: DbSession, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise.", headers={"WWW-Authenticate": "Bearer"})
    try:
        user_id = decode_access_token(credentials.credentials)
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expirée ou jeton invalide. Reconnectez-vous.",
                            headers={"WWW-Authenticate": "Bearer"}) from None
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur introuvable. Reconnectez-vous.", headers={"WWW-Authenticate": "Bearer"})
    return user


CurrentUser = Annotated[User, Depends(require_user)]


def require_admin(user: CurrentUser) -> User:
    if user.user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès réservé aux administrateurs.")
    return user


AdminUser = Annotated[User, Depends(require_admin)]

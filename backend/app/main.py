"""FastAPI application: Airport Manager API (run from backend/: uvicorn app.main:app --reload)."""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import get_settings
from .db import engine
from .routers import admin, auth, flights, locations, me, navigation, offers

settings = get_settings()  # fails early with a clear message if DATABASE_URL or JWT_SECRET is missing

app = FastAPI(
    title="Airport Manager API",
    version="1.0.0",
    description="API de l'application Aéroport Mohammed V (CMN). Authentification : POST /api/auth/login puis bouton « Authorize ».",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_MESSAGES = {404: "Ressource introuvable.", 405: "Méthode non autorisée.", 401: "Authentification requise.", 403: "Accès refusé."}


@app.exception_handler(StarletteHTTPException)
async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) and exc.detail not in ("Not Found", "Method Not Allowed") else None
    return JSONResponse({"detail": detail or DEFAULT_MESSAGES.get(exc.status_code, "Erreur.")}, status_code=exc.status_code,
                        headers=getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [{"champ": ".".join(str(p) for p in e.get("loc", ()) if p != "body"), "message": str(e.get("msg", "")).replace("Value error, ", "")}
              for e in exc.errors()]
    return JSONResponse({"detail": "Données invalides.", "erreurs": errors}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


@app.exception_handler(SQLAlchemyError)
async def database_error(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    return JSONResponse({"detail": "Erreur de base de données. Réessayez plus tard."}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


@app.get("/api/health", tags=["Santé"], summary="État de l'API et de la base de données")
def health() -> JSONResponse:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse({"status": "error", "detail": "Base de données inaccessible."}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return JSONResponse({"status": "ok"})


for module in (auth, flights, me, locations, offers, navigation, admin):
    app.include_router(module.router, prefix="/api")

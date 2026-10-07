import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, get_db, init_db
from backend.app.routes.alerts import router as alerts_router
from backend.app.routes.auth import router as auth_router
from backend.app.routes.health import router as health_router
from backend.app.routes.incidents import router as incidents_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sworders_soc")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Safely verifies and initializes database tables on startup.
    """
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.APP_VERSION)
    init_db()
    # Seed simulated demo data into an empty database (skipped when tests override the DB).
    if settings.SEED_DEMO_DATA and get_db not in app.dependency_overrides:
        try:
            from backend.app.services.demo_seed import ensure_demo_user, seed_demo_data

            with SessionLocal() as db:
                seed_demo_data(db)
                ensure_demo_user(db)
        except Exception as exc:  # noqa: BLE001 - demo seeding must never block startup
            logger.warning("Demo data seeding skipped: %s", exc)
    yield
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Microsoft Innovate 2026 Round 2 — Sworders SOC Backend API.\n\n"
        "**Problem:** '3,000 Alerts, One Analyst'\n\n"
        "**Phase 1 Foundation:** Core alert ingestion, data normalization models, "
        "incident queries, and decoupled service boundaries."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Enable CORS for local development and future React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Global Error Handlers (Clean HTTP errors without credential/stack trace leaks)
# ------------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Clean validation error response for malformed or missing payload fields."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append({"field": loc, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request payload failed schema validation.",
            "details": errors,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Standardized HTTP exception response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "status_code": exc.status_code,
            "detail": exc.detail,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Sanitized 500 internal server error handler to prevent credential or stack leak."""
    logger.error("Unhandled exception processing request '%s %s': %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing your request.",
        },
    )


# ------------------------------------------------------------------------------
# Root Endpoint
# ------------------------------------------------------------------------------
@app.get(
    "/",
    tags=["Root"],
    summary="Root API Info",
    description="Returns service metadata and link to interactive API documentation.",
)
def root():
    """Service landing endpoint."""
    return {
        "project": "Sworders SOC",
        "description": "Microsoft Innovate 2026 - 3,000 Alerts, One Analyst",
        "version": settings.APP_VERSION,
        "phase": "Demo build: ingestion, incidents, investigation workflow",
        "docs_url": "/docs",
        "health_check": f"{settings.API_PREFIX}/health",
    }


# ------------------------------------------------------------------------------
# Include Routers under API Prefix (/api)
# ------------------------------------------------------------------------------
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(incidents_router, prefix=settings.API_PREFIX)

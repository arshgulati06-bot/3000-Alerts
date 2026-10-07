"""API routes package."""

from backend.app.routes.health import router as health_router
from backend.app.routes.alerts import router as alerts_router
from backend.app.routes.incidents import router as incidents_router

__all__ = ["health_router", "alerts_router", "incidents_router"]

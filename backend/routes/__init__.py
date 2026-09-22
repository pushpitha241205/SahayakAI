from backend.routes.auth import router as auth_router
from backend.routes.users import router as users_router
from backend.routes.emergency import router as emergency_router
from backend.routes.contacts import router as contacts_router
from backend.routes.incidents import router as incidents_router
from backend.routes.admin import router as admin_router

__all__ = [
    "auth_router",
    "users_router",
    "emergency_router",
    "contacts_router",
    "incidents_router",
    "admin_router"
]

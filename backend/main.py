import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.routes import (
    auth_router,
    users_router,
    emergency_router,
    contacts_router,
    incidents_router,
    admin_router
)
from backend.utils.seed import seed_default_admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Application Lifespan: Auto-create tables & seed admin
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Sahayak AI database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_default_admin(db)
        finally:
            db.close()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database startup initialization: {e}")
    yield
    logger.info("Shutting down Sahayak AI.")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-Time Help for People in Trouble - Mission Critical Emergency Response System",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(emergency_router)
app.include_router(contacts_router)
app.include_router(incidents_router)
app.include_router(admin_router)

# Real-Time WebSocket for Live SOS Broadcasting
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast received alert to all connected monitoring screens
            await ws_manager.broadcast(data)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Static files and frontend serving
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/manifest.json")
    def serve_manifest():
        return FileResponse(os.path.join(frontend_dir, "manifest.json"), media_type="application/manifest+json")

    @app.get("/sw.js")
    def serve_sw():
        return FileResponse(os.path.join(frontend_dir, "sw.js"), media_type="application/javascript")

    @app.get("/icons/{icon_name}")
    def serve_icon(icon_name: str):
        icon_path = os.path.join(frontend_dir, "icons", icon_name)
        if os.path.exists(icon_path):
            return FileResponse(icon_path, media_type="image/png")
        return FileResponse(os.path.join(frontend_dir, "icons", "icon-192.png"), media_type="image/png")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    @app.get("/{page}.html")
    def serve_html_page(page: str):
        file_path = os.path.join(frontend_dir, f"{page}.html")
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dir, "index.html"))


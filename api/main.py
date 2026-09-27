"""
Touse FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import rooms, designs, listings, messages, purchases, resell, health
from api.config import settings
# NOTE: Run with:  uvicorn api.main:app --reload
# or from inside /api dir: uvicorn main:app --reload  (adjust imports below if needed)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Touse API starting — env: {settings.environment}")
    yield
    # Shutdown
    print("👋 Touse API shutting down")


app = FastAPI(
    title="Touse API",
    version="0.1.0",
    description="AI-powered furniture marketplace backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
app.include_router(designs.router, prefix="/designs", tags=["designs"])
# designs router also handles /rooms/{id}/designs indirectly — keep prefix as /designs
app.include_router(listings.router, prefix="/listings", tags=["listings"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])
app.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
app.include_router(resell.router, prefix="/resell", tags=["resell"])

"""Crea la aplicación FastAPI, registra CORS con credenciales e incluye los routers bajo /api/v1."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Crea las tablas que falten; los datos iniciales se cargan con python -m app.db.seed
    create_all_tables()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Food Store API",
        description="API REST del sistema de pedidos de comida Food Store.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # allow_credentials permite que el navegador envíe y reciba la cookie de sesión
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for router in (auth_router, usuarios_router, categorias_router, productos_router, pedidos_router):
        app.include_router(router, prefix=API_PREFIX)

    return app


app = create_app()

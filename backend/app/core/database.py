"""Conexión a la base de datos."""

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# SQLite no permite por defecto usar una conexión desde otro hilo, y FastAPI atiende
# los endpoints sincrónicos en un pool de hilos. PostgreSQL no necesita este ajuste.
_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

# Instancia única del engine para toda la aplicación
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args)


def session_factory() -> Session:
    """Crea una sesión nueva. La usa el Unit of Work al abrir cada transacción."""
    # expire_on_commit=False: los objetos siguen legibles después del commit
    return Session(engine, expire_on_commit=False)


def create_all_tables() -> None:
    """Crea las tablas que todavía no existen."""
    # Importar los modelos los registra en SQLModel.metadata antes de crear las tablas
    import app.modules.categorias.models  # noqa: F401
    import app.modules.pedidos.models  # noqa: F401
    import app.modules.productos.models  # noqa: F401
    import app.modules.usuarios.models  # noqa: F401

    SQLModel.metadata.create_all(engine)

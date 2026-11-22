from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.core.fechas import ahora_utc

if TYPE_CHECKING:
    from app.modules.pedidos.models import Pedido


class Usuario(SQLModel, table=True):
    """Usuario del sistema. La baja es lógica: disabled = True."""

    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="user")  # "user" o "admin"
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=ahora_utc)

    pedidos: list["Pedido"] = Relationship(back_populates="usuario")

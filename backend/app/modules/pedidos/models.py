from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.core.fechas import ahora_utc

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class Pedido(SQLModel, table=True):
    """Pedido de un usuario. No se borra: se cancela.

    total es la suma de los subtotales de sus líneas y queda fijo desde la creación.
    """

    __tablename__ = "pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", index=True)
    estado: str = Field(default="PENDIENTE", index=True)
    forma_pago: str
    direccion_entrega: str = Field(max_length=200)
    notas: Optional[str] = Field(default=None)
    total: float = Field(default=0)
    created_at: datetime = Field(default_factory=ahora_utc)
    updated_at: datetime = Field(default_factory=ahora_utc)

    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"order_by": "DetallePedido.id"},
    )


class DetallePedido(SQLModel, table=True):
    """Línea inmutable de un pedido.

    nombre_producto y precio_unitario se copian del producto al crear el pedido,
    así un cambio posterior en el catálogo no modifica pedidos ya hechos.
    """

    __tablename__ = "detalles_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", index=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    cantidad: int
    nombre_producto: str
    precio_unitario: float
    subtotal: float

    pedido: Optional[Pedido] = Relationship(back_populates="items")
    producto: Optional["Producto"] = Relationship(back_populates="detalles")

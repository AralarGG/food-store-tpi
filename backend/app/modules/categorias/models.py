from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto


class Categoria(SQLModel, table=True):
    """Categoría del catálogo. La baja es lógica: activo = False.

    Dar de baja una categoría no libera su nombre ni oculta sus productos.
    """

    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True, index=True)
    descripcion: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)

    productos: list["Producto"] = Relationship(back_populates="categoria")

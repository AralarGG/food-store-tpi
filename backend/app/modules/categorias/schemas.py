from typing import Optional

from pydantic import ConfigDict
from sqlmodel import Field, SQLModel


class CategoriaBase(SQLModel):
    # Quita espacios al inicio y al final: un nombre de puros espacios no pasa el mínimo
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)


class CategoriaRead(CategoriaBase):
    id: int
    activo: bool

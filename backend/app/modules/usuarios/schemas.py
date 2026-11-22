from pydantic import ConfigDict, EmailStr
from sqlmodel import Field, SQLModel

from app.core.fechas import FechaUTC


class UserCreate(SQLModel):
    """Datos del registro público. El rol no se recibe: siempre se crea como user."""

    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    # bcrypt usa como máximo 72 bytes de la contraseña
    password: str = Field(min_length=8, max_length=72)


class UserPublic(SQLModel):
    """Vista pública del usuario: nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: FechaUTC

"""Schemas propios de auth. El registro y el perfil usan UserCreate y UserPublic del módulo usuarios."""

from sqlmodel import SQLModel


class MensajeRespuesta(SQLModel):
    message: str

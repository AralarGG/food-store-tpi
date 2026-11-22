"""Manejo de fechas.

Las fechas se guardan en UTC sin zona horaria, así PostgreSQL y SQLite las almacenan igual.
Al responder se les agrega la zona UTC para que el frontend las convierta a la hora local.
"""

from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def ahora_utc() -> datetime:
    """Fecha y hora actual en UTC, sin zona horaria, lista para guardar en la base."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def inicio_del_dia_utc() -> datetime:
    """Medianoche de hoy en la hora local del servidor, expresada en UTC sin zona horaria."""
    inicio_local = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
    return inicio_local.astimezone(timezone.utc).replace(tzinfo=None)


def _marcar_utc(valor: datetime) -> datetime:
    return valor.replace(tzinfo=timezone.utc) if valor.tzinfo is None else valor


# Tipo para los schemas de lectura: la fecha leída de la base sale con zona UTC en el JSON
FechaUTC = Annotated[datetime, AfterValidator(_marcar_utc)]

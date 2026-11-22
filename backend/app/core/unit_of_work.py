"""Unit of Work base.

Abre la sesión al entrar al bloque with y al salir hace commit si no hubo errores
o rollback si se lanzó una excepción. En los dos casos cierra la sesión.
Cada módulo define su propio Unit of Work con los repositorios que necesita.

Uso en un Service:
    with self.uow as uow:
        categoria = uow.categorias.get_by_id(1)
"""

from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    def __init__(self) -> None:
        self._session: Session | None = None

    @property
    def session(self) -> Session:
        if self._session is None:
            raise RuntimeError("La sesión solo existe dentro del bloque with del Unit of Work")
        return self._session

    def __enter__(self) -> Self:
        self._session = session_factory()
        self._crear_repositorios(self._session)
        return self

    def _crear_repositorios(self, session: Session) -> None:
        """Cada Unit of Work de módulo crea acá sus repositorios, todos sobre la misma sesión."""

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        session = self.session
        try:
            if exc_type is None:
                session.commit()
            else:
                session.rollback()
        except Exception:
            # Si falla el commit (por ejemplo, una restricción de la base) se deshace todo
            session.rollback()
            raise
        finally:
            session.close()
            self._session = None

"""Repositorio base genérico.

Cada módulo hereda de BaseRepository[T] y agrega sus consultas propias.
Los repositorios no tienen reglas de negocio ni hacen commit: eso le toca al Unit of Work.
"""

from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    def __init__(self, model: type[T], session: Session) -> None:
        self.model = model
        self.session = session

    def get_by_id(self, entity_id: int) -> T | None:
        return self.session.get(self.model, entity_id)

    def get_all(self) -> list[T]:
        # Todos los modelos del proyecto tienen id: ordenar por él mantiene estable el listado
        consulta = select(self.model).order_by(getattr(self.model, "id"))
        return list(self.session.exec(consulta).all())

    def add(self, entity: T) -> T:
        # flush envía el INSERT dentro de la transacción y obtiene el id generado, sin confirmar
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def update(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()

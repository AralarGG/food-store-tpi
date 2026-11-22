from typing import Any, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(Producto, session)

    def search(
        self,
        skip: int,
        limit: int,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
    ) -> tuple[int, list[Producto]]:
        """Devuelve el total de productos activos que cumplen los filtros y la página pedida."""
        condiciones: list[Any] = [col(Producto.activo).is_(True)]
        if search:
            # Búsqueda por nombre sin distinguir mayúsculas; autoescape trata % y _ como texto
            condiciones.append(func.lower(col(Producto.nombre)).contains(search.lower(), autoescape=True))
        if categoria_id is not None:
            condiciones.append(col(Producto.categoria_id) == categoria_id)
        if disponible is not None:
            condiciones.append(col(Producto.disponible).is_(disponible))

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()

        # selectinload trae las categorías de toda la página en una sola consulta adicional
        consulta = (
            select(Producto)
            .where(*condiciones)
            .options(selectinload(Producto.categoria))
            .order_by(col(Producto.id))
            .offset(skip)
            .limit(limit)
        )
        return total, list(self.session.exec(consulta).all())

    def get_for_update(self, ids: list[int]) -> dict[int, Producto]:
        """Lee los productos bloqueando sus filas hasta el commit (SELECT ... FOR UPDATE).

        Otra transacción que quiera modificar los mismos productos espera a que esta termine
        y después lee el stock ya actualizado. Se bloquean siempre en orden de id para que dos
        transacciones con productos en común no queden esperándose entre sí (deadlock).
        """
        consulta = (
            select(Producto)
            .where(col(Producto.id).in_(sorted(set(ids))))
            .order_by(col(Producto.id))
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return {producto.id: producto for producto in self.session.exec(consulta).all() if producto.id is not None}

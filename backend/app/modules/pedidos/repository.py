from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(Pedido, session)

    def get_by_id_for_update(self, pedido_id: int) -> Pedido | None:
        """Lee el pedido bloqueando su fila hasta el commit (SELECT ... FOR UPDATE).

        Dos cambios de estado simultáneos sobre el mismo pedido se hacen de a uno:
        el segundo ve el estado que dejó el primero.
        """
        consulta = (
            select(Pedido)
            .where(col(Pedido.id) == pedido_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return self.session.exec(consulta).first()

    def agregar_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def list_by_usuario(
        self,
        usuario_id: Optional[int],
        skip: int,
        limit: int,
        estado: Optional[str] = None,
    ) -> tuple[int, list[Pedido]]:
        """Pedidos de un usuario, o de todos si usuario_id es None. Los más recientes primero."""
        condiciones: list[Any] = []
        if usuario_id is not None:
            condiciones.append(col(Pedido.usuario_id) == usuario_id)
        if estado is not None:
            condiciones.append(col(Pedido.estado) == estado)

        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()

        # selectinload trae las líneas de todos los pedidos de la página en una sola consulta
        consulta = (
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))
            .order_by(col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        )
        return total, list(self.session.exec(consulta).all())

    def count_by_estado(self) -> dict[str, int]:
        consulta = select(Pedido.estado, func.count()).group_by(Pedido.estado)
        return {estado: cantidad for estado, cantidad in self.session.exec(consulta).all()}

    def count_desde(self, desde: datetime) -> int:
        consulta = select(func.count()).select_from(Pedido).where(col(Pedido.created_at) >= desde)
        return self.session.exec(consulta).one()

    def sum_total_por_estado(self, estado: str) -> float:
        consulta = select(func.coalesce(func.sum(Pedido.total), 0)).where(col(Pedido.estado) == estado)
        return float(self.session.exec(consulta).one())

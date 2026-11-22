from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    """Pedidos y productos comparten la sesión: crear el pedido y descontar el stock
    (o cancelarlo y restituirlo) quedan en la misma transacción."""

    pedidos: PedidoRepository
    productos: ProductoRepository

    def _crear_repositorios(self, session: Session) -> None:
        self.pedidos = PedidoRepository(session)
        self.productos = ProductoRepository(session)

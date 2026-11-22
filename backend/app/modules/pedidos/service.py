"""Reglas de negocio de pedidos.

RN-01 Crear pedido: un solo intento transaccional; si falla una validación no se persiste nada.
RN-02 Transiciones: solo las del mapa TRANSICIONES; los estados terminales no cambian.
RN-03 Cancelar: restituye el stock en la misma transacción que cambia el estado.
RN-04 Permisos: el cliente ve y cancela solo sus pedidos y solo en PENDIENTE; el admin ve todos.
RN-05 Inmutabilidad: las líneas y el total no se modifican después de crear el pedido.
RN-06 Datos del pedido: forma de pago, dirección y cantidades se validan en PedidoCreate y en este Service.

Pedidos simultáneos: los productos y el pedido se leen con bloqueo de fila (SELECT ... FOR UPDATE),
así dos compras de la última unidad o dos cancelaciones del mismo pedido se resuelven de a una.
"""

from typing import Optional

from app.core.fechas import ahora_utc, inicio_del_dia_utc
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    EstadoPedido,
    FormaPago,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.schemas import UserPublic

# Mapa de transiciones válidas de la máquina de estados (RN-02)
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),
    EstadoPedido.CANCELADO: set(),
}


class PedidoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    """El pedido pertenece a otro usuario."""


class ReglaDeNegocioPedido(Exception):
    """Base de las reglas que responden 400."""


class ProductoRepetido(ReglaDeNegocioPedido):
    pass


class ProductoNoDisponible(ReglaDeNegocioPedido):
    pass


class StockInsuficiente(ReglaDeNegocioPedido):
    pass


class TransicionInvalida(ReglaDeNegocioPedido):
    pass


class PedidoNoCancelable(ReglaDeNegocioPedido):
    """El cliente solo puede cancelar pedidos en PENDIENTE."""


class DatosPedidoInvalidos(ReglaDeNegocioPedido):
    pass


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    def crear(self, usuario_id: int, datos: PedidoCreate) -> PedidoRead:
        """RN-01: crea el pedido con sus líneas y descuenta el stock en una sola transacción."""
        with self.uow as uow:
            self._validar_datos(datos)
            ids = [item.producto_id for item in datos.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Un producto no puede repetirse en el pedido: sumá la cantidad en un solo ítem")

            # Bloquea los productos hasta el commit: otro pedido con los mismos productos espera
            # y después ve el stock ya descontado, así no se vende más de lo que hay
            productos = uow.productos.get_for_update(ids)

            # created_at y updated_at arrancan iguales: updated_at cambia solo con un cambio de estado
            ahora = ahora_utc()
            pedido = Pedido(
                usuario_id=usuario_id,
                estado=EstadoPedido.PENDIENTE.value,
                forma_pago=datos.forma_pago.value,
                direccion_entrega=datos.direccion_entrega,
                notas=datos.notas or None,
                total=0,
                created_at=ahora,
                updated_at=ahora,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in datos.items:
                # Verificar, descontar y crear la línea en la misma iteración
                producto = productos.get(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"El producto {item.producto_id} no existe")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}': "
                        f"hay {producto.stock} y se pidieron {item.cantidad}"
                    )

                producto.stock -= item.cantidad
                uow.productos.update(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.agregar_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.pedidos.update(pedido)
            return PedidoRead.model_validate(pedido)

    def listar(
        self,
        usuario: UserPublic,
        skip: int,
        limit: int,
        estado: Optional[EstadoPedido],
        propios: bool,
    ) -> PedidosPaginados:
        """El cliente ve sus pedidos; el admin ve todos, o solo los suyos si pide propios."""
        usuario_id = usuario.id if usuario.role != "admin" or propios else None
        with self.uow as uow:
            total, pedidos = uow.pedidos.list_by_usuario(
                usuario_id, skip, limit, estado.value if estado else None
            )
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in pedidos])

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No tenés acceso a este pedido")
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo_estado: EstadoPedido) -> PedidoRead:
        """Uso del admin: avanza o cancela según la máquina de estados."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            self._aplicar_transicion(uow, pedido, nuevo_estado)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        """Uso del cliente dueño: solo puede cancelar mientras el pedido está en PENDIENTE."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No tenés acceso a este pedido")
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise PedidoNoCancelable("Solo se puede cancelar un pedido en estado PENDIENTE")
            self._aplicar_transicion(uow, pedido, EstadoPedido.CANCELADO)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE.value, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION.value, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO.value, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO.value, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_del_dia_utc()),
                ingresos_entregados=round(uow.pedidos.sum_total_por_estado(EstadoPedido.ENTREGADO.value), 2),
            )

    @staticmethod
    def _validar_datos(datos: PedidoCreate) -> None:
        """RN-06 y cantidades: las mismas reglas del schema, verificadas otra vez antes de tocar el stock."""
        if not datos.items:
            raise DatosPedidoInvalidos("El pedido debe tener al menos un producto")
        if any(item.cantidad < 1 for item in datos.items):
            raise DatosPedidoInvalidos("La cantidad de cada producto debe ser al menos 1")
        if not 5 <= len(datos.direccion_entrega.strip()) <= 200:
            raise DatosPedidoInvalidos("La dirección de entrega debe tener entre 5 y 200 caracteres")
        if datos.forma_pago not in (FormaPago.EFECTIVO, FormaPago.TRANSFERENCIA):
            raise DatosPedidoInvalidos("La forma de pago debe ser EFECTIVO o TRANSFERENCIA")

    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int, bloquear: bool = False) -> Pedido:
        # Para cambiar el estado se bloquea la fila: un segundo cambio simultáneo espera y ve el estado nuevo
        pedido = uow.pedidos.get_by_id_for_update(pedido_id) if bloquear else uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado("Pedido no encontrado")
        return pedido

    @staticmethod
    def _aplicar_transicion(uow: PedidoUnitOfWork, pedido: Pedido, nuevo_estado: EstadoPedido) -> None:
        """Valida la transición antes de modificar el pedido y, si es una cancelación, restituye el stock."""
        estado_actual = EstadoPedido(pedido.estado)
        if nuevo_estado not in TRANSICIONES[estado_actual]:
            raise TransicionInvalida(
                f"No se puede pasar un pedido de {estado_actual.value} a {nuevo_estado.value}"
            )

        if nuevo_estado == EstadoPedido.CANCELADO:
            # RN-03: cada línea devuelve su cantidad al stock del producto, con los productos bloqueados
            productos = uow.productos.get_for_update([detalle.producto_id for detalle in pedido.items])
            for detalle in pedido.items:
                producto = productos.get(detalle.producto_id)
                if producto is not None:
                    producto.stock += detalle.cantidad
                    uow.productos.update(producto)

        pedido.estado = nuevo_estado.value
        pedido.updated_at = ahora_utc()
        uow.pedidos.update(pedido)

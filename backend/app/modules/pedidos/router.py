from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import AdminActual, UsuarioActual
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ReglaDeNegocioPedido,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


ServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un pedido a partir del carrito",
)
def crear_pedido(datos: PedidoCreate, usuario: UsuarioActual, service: ServiceDep) -> PedidoRead:
    try:
        return service.crear(usuario.id, datos)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ReglaDeNegocioPedido as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "",
    response_model=PedidosPaginados,
    summary="Pedidos propios (user) o de todos los usuarios (admin)",
)
def listar_pedidos(
    usuario: UsuarioActual,
    service: ServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: Optional[EstadoPedido] = None,
    propios: Annotated[bool, Query(description="Con true, el admin ve solo sus propios pedidos")] = False,
) -> PedidosPaginados:
    return service.listar(usuario, skip, limit, estado, propios)


# Se declara antes de /{id} para que "resumen" no se interprete como un id
@router.get("/resumen", response_model=ResumenPedidos, summary="Indicadores para el panel de administración")
def resumen_pedidos(_admin: AdminActual, service: ServiceDep) -> ResumenPedidos:
    return service.resumen()


@router.get("/{id}", response_model=PedidoRead, summary="Detalle de un pedido con sus líneas")
def obtener_pedido(id: int, usuario: UsuarioActual, service: ServiceDep) -> PedidoRead:
    try:
        return service.obtener(id, usuario)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PedidoAjeno as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error


@router.patch(
    "/{id}/estado",
    response_model=PedidoRead,
    summary="Avanza o cancela un pedido según la máquina de estados",
)
def cambiar_estado(id: int, datos: CambioEstado, _admin: AdminActual, service: ServiceDep) -> PedidoRead:
    try:
        return service.cambiar_estado(id, datos.estado)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ReglaDeNegocioPedido as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.patch("/{id}/cancelar", response_model=PedidoRead, summary="El cliente cancela su pedido en PENDIENTE")
def cancelar_pedido(id: int, usuario: UsuarioActual, service: ServiceDep) -> PedidoRead:
    try:
        return service.cancelar(id, usuario)
    except PedidoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PedidoAjeno as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ReglaDeNegocioPedido as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

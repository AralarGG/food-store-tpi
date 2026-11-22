from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import AdminActual
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import DatosProductoInvalidos, ProductoNoEncontrado, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

router = APIRouter(prefix="/productos", tags=["Productos"])


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


ServiceDep = Annotated[ProductoService, Depends(get_producto_service)]


@router.get("", response_model=ProductosPaginados, summary="Listado paginado de productos activos")
def listar_productos(
    service: ServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[Optional[str], Query(description="Busca en el nombre sin distinguir mayúsculas")] = None,
    categoria_id: Optional[int] = None,
    disponible: Optional[bool] = None,
) -> ProductosPaginados:
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{id}", response_model=ProductoRead, summary="Detalle de un producto con su categoría")
def obtener_producto(id: int, service: ServiceDep) -> ProductoRead:
    try:
        return service.obtener(id)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Alta de un producto",
)
def crear_producto(datos: ProductoCreate, _admin: AdminActual, service: ServiceDep) -> ProductoRead:
    try:
        return service.crear(datos)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DatosProductoInvalidos as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put("/{id}", response_model=ProductoRead, summary="Actualización de los campos enviados")
def actualizar_producto(
    id: int, datos: ProductoUpdate, _admin: AdminActual, service: ServiceDep
) -> ProductoRead:
    try:
        return service.actualizar(id, datos)
    except (ProductoNoEncontrado, CategoriaNoEncontrada) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DatosProductoInvalidos as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.patch("/{id}/stock", response_model=ProductoRead, summary="Actualización de stock y disponibilidad")
def actualizar_stock(
    id: int, datos: ProductoStockUpdate, _admin: AdminActual, service: ServiceDep
) -> ProductoRead:
    try:
        return service.actualizar_stock(id, datos)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DatosProductoInvalidos as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Baja lógica de un producto")
def eliminar_producto(id: int, _admin: AdminActual, service: ServiceDep) -> None:
    try:
        service.eliminar(id)
    except ProductoNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

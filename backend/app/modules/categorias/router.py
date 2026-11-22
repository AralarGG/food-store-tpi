from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import AdminActual
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    DatosCategoriaInvalidos,
    NombreDuplicado,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


ServiceDep = Annotated[CategoriaService, Depends(get_categoria_service)]


@router.get("", response_model=list[CategoriaRead], summary="Listado de categorías activas")
def listar_categorias(service: ServiceDep) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead, summary="Detalle de una categoría")
def obtener_categoria(id: int, service: ServiceDep) -> CategoriaRead:
    try:
        return service.obtener(id)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Alta de una categoría",
)
def crear_categoria(datos: CategoriaCreate, _admin: AdminActual, service: ServiceDep) -> CategoriaRead:
    try:
        return service.crear(datos)
    except NombreDuplicado as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except DatosCategoriaInvalidos as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put("/{id}", response_model=CategoriaRead, summary="Actualización de los campos enviados")
def actualizar_categoria(
    id: int, datos: CategoriaUpdate, _admin: AdminActual, service: ServiceDep
) -> CategoriaRead:
    try:
        return service.actualizar(id, datos)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except NombreDuplicado as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except DatosCategoriaInvalidos as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Baja lógica de una categoría")
def eliminar_categoria(id: int, _admin: AdminActual, service: ServiceDep) -> None:
    try:
        service.eliminar(id)
    except CategoriaNoEncontrada as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

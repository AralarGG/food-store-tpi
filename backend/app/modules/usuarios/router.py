from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import AdminActual
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import DesactivacionPropia, UsuarioNoEncontrado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


ServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]


@router.get("", response_model=list[UserPublic], summary="Listado de usuarios")
def listar_usuarios(_admin: AdminActual, service: ServiceDep) -> list[UserPublic]:
    return service.listar()


@router.post("/{id}/activar", response_model=UserPublic, summary="Activar un usuario")
def activar_usuario(id: int, _admin: AdminActual, service: ServiceDep) -> UserPublic:
    try:
        return service.activar(id)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/{id}/desactivar", response_model=UserPublic, summary="Desactivar un usuario")
def desactivar_usuario(id: int, admin: AdminActual, service: ServiceDep) -> UserPublic:
    try:
        return service.desactivar(id, admin_id=admin.id)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DesactivacionPropia as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

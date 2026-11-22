"""Gestión de usuarios por parte del admin: listado, activación y desactivación."""

from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(Exception):
    pass


class DesactivacionPropia(Exception):
    """El admin intentó desactivar su propia cuenta."""


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(usuario) for usuario in uow.usuarios.get_all()]

    def activar(self, usuario_id: int) -> UserPublic:
        return self._cambiar_estado(usuario_id, disabled=False)

    def desactivar(self, usuario_id: int, admin_id: int) -> UserPublic:
        if usuario_id == admin_id:
            raise DesactivacionPropia("No podés desactivar tu propia cuenta")
        return self._cambiar_estado(usuario_id, disabled=True)

    def _cambiar_estado(self, usuario_id: int, disabled: bool) -> UserPublic:
        # Operación idempotente: si el usuario ya está en ese estado responde igual
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado("Usuario no encontrado")
            usuario.disabled = disabled
            uow.usuarios.update(usuario)
            return UserPublic.model_validate(usuario)

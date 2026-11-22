"""Dependencias de autenticación y autorización.

Orden en que se resuelven en un endpoint protegido:
    oauth2_scheme: toma el token de la cookie HttpOnly access_token
    get_current_user: valida el JWT y carga el usuario (401 si falla)
    get_current_active_user: rechaza cuentas desactivadas (400)
    require_role: verifica que el rol esté permitido (403)
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

COOKIE_SESION = "access_token"
MENSAJE_CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    """Toma el token solo de la cookie. El encabezado Authorization no se acepta:
    para enviarlo el frontend tendría que poder leer el token, y la cookie HttpOnly
    existe justamente para que JavaScript no pueda hacerlo."""

    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get(COOKIE_SESION)
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        return token


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


def get_usuario_uow() -> UsuarioUnitOfWork:
    return UsuarioUnitOfWork()


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    uow: Annotated[UsuarioUnitOfWork, Depends(get_usuario_uow)],
) -> UserPublic:
    """Valida el JWT de la cookie y devuelve el usuario al que pertenece."""
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o sesión vencida",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credenciales_invalidas

    username = payload.get("sub")
    if not isinstance(username, str):
        raise credenciales_invalidas

    with uow:
        usuario = uow.usuarios.get_by_username(username)
        if usuario is None:
            raise credenciales_invalidas
        return UserPublic.model_validate(usuario)


def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """Un usuario desactivado existe pero no puede operar."""
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=MENSAJE_CUENTA_DESACTIVADA)
    return current_user


def require_role(allowed_roles: list[str]) -> Callable[[UserPublic], UserPublic]:
    """Genera una dependencia que solo deja pasar a los roles indicados.

    Uso: Annotated[UserPublic, Depends(require_role(["admin"]))]
    """

    def role_checker(current_user: Annotated[UserPublic, Depends(get_current_active_user)]) -> UserPublic:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para realizar esta operación",
            )
        return current_user

    return role_checker


# Atajos para los parámetros de los endpoints
UsuarioActual = Annotated[UserPublic, Depends(get_current_active_user)]
AdminActual = Annotated[UserPublic, Depends(require_role(["admin"]))]

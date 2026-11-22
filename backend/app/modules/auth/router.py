from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import COOKIE_SESION, UsuarioActual
from app.modules.auth.schemas import MensajeRespuesta
from app.modules.auth.service import AuthService, CredencialesInvalidas, CuentaDesactivada, UsuarioDuplicado
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


ServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Registro de un usuario con rol user",
)
def registrar(datos: UserCreate, service: ServiceDep) -> UserPublic:
    try:
        return service.registrar(datos)
    except UsuarioDuplicado as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/token", response_model=MensajeRespuesta, summary="Login: guarda el JWT en una cookie HttpOnly")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: ServiceDep,
) -> MensajeRespuesta:
    try:
        token = service.autenticar(form_data.username, form_data.password)
    except CredencialesInvalidas as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    except CuentaDesactivada as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    # El token viaja solo en la cookie: JavaScript no puede leerla y el cuerpo no lo incluye
    response.set_cookie(
        key=COOKIE_SESION,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # en producción, con HTTPS, va en True
        path="/",
    )
    return MensajeRespuesta(message="Login exitoso")


@router.post("/logout", response_model=MensajeRespuesta, summary="Cierra la sesión borrando la cookie")
def logout(response: Response) -> MensajeRespuesta:
    # El JWT no se revoca: si alguien guardó una copia sigue valiendo hasta que vence
    response.delete_cookie(key=COOKIE_SESION, httponly=True, samesite="lax", secure=False, path="/")
    return MensajeRespuesta(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic, summary="Usuario de la sesión actual")
def perfil(usuario: UsuarioActual) -> UserPublic:
    return usuario

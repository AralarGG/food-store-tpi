"""Reglas de negocio de categorías: nombre único y baja lógica.

Una categoría dada de baja se trata como inexistente: su detalle, PUT y DELETE responden 404.
El largo del nombre se valida en el schema y también acá, para no depender solo de la entrada.
"""

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

LARGO_MINIMO_NOMBRE = 2
LARGO_MAXIMO_NOMBRE = 100


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class DatosCategoriaInvalidos(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.listar_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._obtener_activa(uow, categoria_id)
            return CategoriaRead.model_validate(categoria)

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            self._validar_largo_nombre(datos.nombre)
            self._validar_nombre_unico(uow, datos.nombre)
            categoria = Categoria.model_validate(datos)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._obtener_activa(uow, categoria_id)
            cambios = datos.model_dump(exclude_unset=True)
            # El nombre es obligatorio: si llega nulo se conserva el actual
            if cambios.get("nombre") is None:
                cambios.pop("nombre", None)
            else:
                self._validar_largo_nombre(cambios["nombre"])
                self._validar_nombre_unico(uow, cambios["nombre"], excluir_id=categoria_id)
            categoria.sqlmodel_update(cambios)
            uow.categorias.update(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        # Baja lógica: los productos de la categoría no se tocan
        with self.uow as uow:
            categoria = self._obtener_activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.update(categoria)

    @staticmethod
    def _obtener_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria

    @staticmethod
    def _validar_largo_nombre(nombre: str) -> None:
        if not LARGO_MINIMO_NOMBRE <= len(nombre.strip()) <= LARGO_MAXIMO_NOMBRE:
            raise DatosCategoriaInvalidos(
                f"El nombre debe tener entre {LARGO_MINIMO_NOMBRE} y {LARGO_MAXIMO_NOMBRE} caracteres"
            )

    @staticmethod
    def _validar_nombre_unico(uow: CategoriaUnitOfWork, nombre: str, excluir_id: int | None = None) -> None:
        existente = uow.categorias.get_by_nombre(nombre)
        if existente is not None and existente.id != excluir_id:
            raise NombreDuplicado(f"Ya existe una categoría con el nombre '{nombre}'")

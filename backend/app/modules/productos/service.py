"""Reglas de negocio de productos: categoría válida, stock, disponibilidad y baja lógica.

Un producto dado de baja se trata como inexistente: su detalle, PUT, PATCH y DELETE responden 404.
Nombre, precio y stock se validan en el schema y también acá, para no depender solo de la entrada.
"""

from typing import Any, Optional

from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork

# Campos obligatorios: si llegan nulos en una actualización se conserva el valor actual.
# descripcion e imagen_url sí aceptan nulo, para poder borrarlas.
CAMPOS_OBLIGATORIOS = {"nombre", "precio_base", "stock", "disponible", "categoria_id"}


class ProductoNoEncontrado(Exception):
    pass


class DatosProductoInvalidos(Exception):
    pass


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: Optional[str],
        categoria_id: Optional[int],
        disponible: Optional[bool],
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(
                total=total,
                items=[ProductoRead.model_validate(producto) for producto in productos],
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            return ProductoRead.model_validate(producto)

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_datos(datos.model_dump())
            self._validar_categoria(uow, datos.categoria_id)
            producto = Producto.model_validate(datos)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            cambios = self._cambios_enviados(datos.model_dump(exclude_unset=True))
            self._validar_datos(cambios)
            if "categoria_id" in cambios:
                self._validar_categoria(uow, cambios["categoria_id"])
            producto.sqlmodel_update(cambios)
            uow.productos.update(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, datos: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            cambios = self._cambios_enviados(datos.model_dump(exclude_unset=True))
            self._validar_datos(cambios)
            producto.sqlmodel_update(cambios)
            uow.productos.update(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        # Baja lógica: el producto deja de listarse pero los pedidos que lo incluyen no cambian
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            producto.activo = False
            uow.productos.update(producto)

    @staticmethod
    def _cambios_enviados(cambios: dict[str, Any]) -> dict[str, Any]:
        return {campo: valor for campo, valor in cambios.items() if valor is not None or campo not in CAMPOS_OBLIGATORIOS}

    @staticmethod
    def _validar_datos(datos: dict[str, Any]) -> None:
        """Revisa solo los campos presentes: sirve para el alta y para las actualizaciones parciales."""
        if "nombre" in datos and not datos["nombre"].strip():
            raise DatosProductoInvalidos("El nombre del producto no puede estar vacío")
        if "precio_base" in datos and datos["precio_base"] < 0:
            raise DatosProductoInvalidos("El precio no puede ser negativo")
        if "stock" in datos and datos["stock"] < 0:
            raise DatosProductoInvalidos("El stock no puede ser negativo")

    @staticmethod
    def _obtener_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado("Producto no encontrado")
        return producto

    @staticmethod
    def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("La categoría no existe o está dada de baja")

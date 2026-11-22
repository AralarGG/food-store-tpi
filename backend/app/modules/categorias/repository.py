from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(Categoria, session)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """Busca sin distinguir mayúsculas e incluye las dadas de baja, que conservan su nombre."""
        consulta = select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        return self.session.exec(consulta).first()

    def listar_activas(self) -> list[Categoria]:
        consulta = select(Categoria).where(col(Categoria.activo).is_(True)).order_by(col(Categoria.id))
        return list(self.session.exec(consulta).all())

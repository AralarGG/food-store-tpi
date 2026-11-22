"""Carga de datos iniciales. Es idempotente: se puede ejecutar varias veces sin duplicar registros.

Uso (desde la carpeta backend):
    python -m app.db.seed
"""

from sqlmodel import select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

USUARIOS = [
    {
        "username": "admin",
        "full_name": "Administrador Food Store",
        "email": "admin@foodstore.com",
        "password": "Admin1234!",
        "role": "admin",
    },
    {
        "username": "cliente",
        "full_name": "Cliente de Prueba",
        "email": "cliente@foodstore.com",
        "password": "Cliente1234!",
        "role": "user",
    },
]

CATEGORIAS = [
    ("Pizzas", "Pizzas al molde con masa casera"),
    ("Hamburguesas", "Hamburguesas de carne vacuna con papas"),
    ("Empanadas", "Empanadas al horno, por unidad"),
    ("Pastas", "Pastas frescas con salsa a elección"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Postres caseros y helado"),
]

# (categoría, nombre, descripción, precio, stock)
PRODUCTOS = [
    ("Pizzas", "Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas verdes", 9500, 25),
    ("Pizzas", "Pizza Napolitana", "Muzzarella, rodajas de tomate, ajo y orégano", 10800, 20),
    ("Pizzas", "Pizza Fugazzeta", "Rellena de muzzarella con cebolla y orégano", 11200, 15),
    ("Hamburguesas", "Hamburguesa Clásica", "Medallón de 180 g, lechuga, tomate y queso", 8900, 30),
    ("Hamburguesas", "Hamburguesa Doble Cheddar", "Doble medallón, cheddar y panceta", 11500, 20),
    ("Empanadas", "Empanada de Carne", "Carne cortada a cuchillo, cebolla y huevo", 1600, 60),
    ("Empanadas", "Empanada de Jamón y Queso", "Jamón cocido y muzzarella", 1500, 60),
    ("Pastas", "Ñoquis con Bolognesa", "Ñoquis de papa con salsa bolognesa", 9200, 15),
    ("Pastas", "Sorrentinos de Jamón y Queso", "Con salsa fileto o crema", 10500, 12),
    ("Bebidas", "Agua Mineral 500 ml", "Sin gas", 1800, 50),
    ("Bebidas", "Gaseosa Cola 1,5 L", "Línea regular", 3900, 40),
    ("Bebidas", "Cerveza IPA 473 ml", "Lata de cerveza artesanal", 4200, 24),
    ("Postres", "Flan con Dulce de Leche", "Flan casero con dulce de leche", 4500, 18),
    ("Postres", "Helado 1/4 kg", "Hasta tres gustos", 6200, 20),
]


def run() -> None:
    print("Cargando datos iniciales de Food Store")
    create_all_tables()

    with session_factory() as session:
        for datos in USUARIOS:
            existente = session.exec(select(Usuario).where(Usuario.username == datos["username"])).first()
            if existente:
                print(f"  Ya existe el usuario {datos['username']}")
                continue
            session.add(
                Usuario(
                    username=datos["username"],
                    full_name=datos["full_name"],
                    email=datos["email"],
                    hashed_password=hash_password(datos["password"]),
                    role=datos["role"],
                )
            )
            print(f"  Usuario creado: {datos['username']} / {datos['password']} (rol {datos['role']})")

        categorias: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS:
            categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
                print(f"  Categoría creada: {nombre}")
            categorias[nombre] = categoria
        # flush asigna los id de las categorías nuevas antes de crear los productos
        session.flush()

        for nombre_categoria, nombre, descripcion, precio, stock in PRODUCTOS:
            if session.exec(select(Producto).where(Producto.nombre == nombre)).first():
                continue
            session.add(
                Producto(
                    categoria_id=categorias[nombre_categoria].id,
                    nombre=nombre,
                    descripcion=descripcion,
                    precio_base=precio,
                    stock=stock,
                )
            )
            print(f"  Producto creado: {nombre}")

        session.commit()

    print("Datos iniciales listos.")


if __name__ == "__main__":
    run()

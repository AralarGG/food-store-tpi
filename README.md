# Food Store

Trabajo Práctico Integrador de Programación 4. Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos; el administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

- Alumno: Santiago Raúl Salinas
- Repositorio: https://github.com/AralarGG/food-store-tpi
- Video de demostración: https://youtu.be/xY0RtOfo48c

## Tecnologías

| Parte | Tecnologías |
|-------|-------------|
| Backend | Python, FastAPI, SQLModel, PostgreSQL, JWT en cookie HttpOnly (python-jose), bcrypt (passlib), pydantic-settings |
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Form, TanStack Table, React Router, Zustand, Axios |

## Requisitos

- Python 3.11, 3.12 o 3.13 (SQLModel 0.0.22 no funciona con Python 3.14)
- PostgreSQL 15 o superior
- Node.js 20.19 o superior
- pnpm 9 o superior (si no está instalado: `npm install -g pnpm`)

## Estructura del repositorio

```
food-store-tpi/
├── backend/     API REST con FastAPI (arquitectura en capas por módulo)
├── frontend/    Aplicación React organizada por features
└── README.md
```

## Backend

### 1. Crear la base de datos

Crear una base vacía llamada `foodstore_db` en PostgreSQL, por ejemplo desde pgAdmin (clic derecho en Databases > Create > Database) o con psql:

```sql
CREATE DATABASE foodstore_db;
```

Las tablas las crea la aplicación.

### 2. Instalar las dependencias

Desde la carpeta `backend`:

```bash
# Windows
py -3.13 -m venv venv
venv\Scripts\activate

# Linux o macOS
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar las variables de entorno

Copiar `backend/.env.example` como `backend/.env` y completar los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://postgres:TU_CONTRASEÑA@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Clave para firmar los JWT, de al menos 32 caracteres | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración de la sesión (cookie y token) | `30` |
| `FRONTEND_ORIGIN` | Origen del frontend permitido en CORS | `http://localhost:5173` |

Para generar una `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Si la contraseña de PostgreSQL tiene caracteres como `@`, `:`, `/` o `#`, hay que escribirlos codificados en la URL (por ejemplo, `@` como `%40`).

Para desarrollo sin PostgreSQL se puede usar SQLite con `DATABASE_URL=sqlite:///./foodstore.db`.

### 4. Cargar los datos iniciales

```bash
python -m app.db.seed
```

Crea las tablas y carga los usuarios, 6 categorías y 14 productos con stock. Se puede ejecutar varias veces: no duplica registros.

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `Admin1234!` | admin |
| `cliente` | `Cliente1234!` | user |

### 5. Ejecutar

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

## Frontend

Con el backend en ejecución, desde la carpeta `frontend`:

### 1. Configurar la variable de entorno

Copiar `frontend/.env.example` como `frontend/.env`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API, con el prefijo `/api/v1` | `http://localhost:8000/api/v1` |

### 2. Instalar, verificar y ejecutar

```bash
pnpm install
pnpm build
pnpm dev
```

`pnpm build` compila el proyecto y verifica los tipos de TypeScript. La aplicación queda en http://localhost:5173.

Hay que abrirla como `localhost` y no como `127.0.0.1`: la cookie de sesión y el CORS están configurados para `http://localhost:5173`.

## Funcionalidades

### Cliente

- Registro e inicio de sesión. La sesión viaja en una cookie HttpOnly: el frontend nunca lee ni guarda el token.
- Catálogo paginado en el servidor, con búsqueda por nombre, filtro por categoría y por disponibilidad.
- Carrito guardado en el navegador: se conserva al recargar la página.
- Confirmación del pedido con dirección de entrega, forma de pago (efectivo o transferencia) y notas.
- Mis pedidos: listado, detalle y cancelación mientras el pedido está pendiente.

### Administrador

- Resumen: cantidad de pedidos por estado, pedidos del día e ingresos de los pedidos entregados.
- Pedidos: filtro por estado y cambio de estado según la máquina de estados.
- Productos y categorías: alta, edición y baja lógica; cambio de stock y disponibilidad.
- Usuarios: activación y desactivación. El administrador no puede desactivar su propia cuenta.

### Reglas de negocio

- Un pedido se crea completo o no se crea: si un producto no tiene stock, no se guarda nada.
- El stock se descuenta al crear el pedido y se restituye al cancelarlo, en la misma transacción.
- Cada línea del pedido guarda el nombre y el precio del producto, así los pedidos no cambian si después cambia el catálogo.
- Estados del pedido: `PENDIENTE` > `EN_PREPARACION` > `ENTREGADO`, y `CANCELADO` desde los dos primeros. `ENTREGADO` y `CANCELADO` son finales.
- Las bajas son lógicas: un registro dado de baja responde 404, y una categoría dada de baja conserva su nombre y no oculta sus productos.

## Endpoints

Todos bajo el prefijo `/api/v1`.

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/auth/register` | Público |
| POST | `/auth/token` | Público |
| POST | `/auth/logout` | Público |
| GET | `/auth/me` | Sesión |
| GET | `/admin/usuarios` | admin |
| POST | `/admin/usuarios/{id}/activar` | admin |
| POST | `/admin/usuarios/{id}/desactivar` | admin |
| GET | `/categorias` | Público |
| GET | `/categorias/{id}` | Público |
| POST | `/categorias` | admin |
| PUT | `/categorias/{id}` | admin |
| DELETE | `/categorias/{id}` | admin |
| GET | `/productos` | Público |
| GET | `/productos/{id}` | Público |
| POST | `/productos` | admin |
| PUT | `/productos/{id}` | admin |
| PATCH | `/productos/{id}/stock` | admin |
| DELETE | `/productos/{id}` | admin |
| POST | `/pedidos` | Sesión |
| GET | `/pedidos` | Sesión (propios) o admin (todos) |
| GET | `/pedidos/resumen` | admin |
| GET | `/pedidos/{id}` | Dueño o admin |
| PATCH | `/pedidos/{id}/estado` | admin |
| PATCH | `/pedidos/{id}/cancelar` | Dueño |

`GET /pedidos` acepta además `propios=true`, que la pantalla "Mis pedidos" usa para que un administrador vea solo sus propios pedidos.

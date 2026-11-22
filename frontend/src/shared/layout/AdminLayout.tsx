import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SkeletonFilas } from '../components/Skeleton'

const secciones = [
  { ruta: '/admin/resumen', nombre: 'Resumen' },
  { ruta: '/admin/pedidos', nombre: 'Pedidos' },
  { ruta: '/admin/productos', nombre: 'Productos' },
  { ruta: '/admin/categorias', nombre: 'Categorías' },
  { ruta: '/admin/usuarios', nombre: 'Usuarios' },
]

// Pestañas comunes a todas las pantallas del panel de administración
export const AdminLayout = () => (
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
    <nav aria-label="Secciones del panel" className="mt-4 flex gap-1 overflow-x-auto border-b border-stone-200">
      {secciones.map((seccion) => (
        <NavLink
          key={seccion.ruta}
          to={seccion.ruta}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap ${
              isActive
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800'
            }`
          }
        >
          {seccion.nombre}
        </NavLink>
      ))}
    </nav>
    <div className="mt-6">
      {/* Mientras se descarga la pantalla elegida del panel */}
      <Suspense fallback={<SkeletonFilas />}>
        <Outlet />
      </Suspense>
    </div>
  </div>
)

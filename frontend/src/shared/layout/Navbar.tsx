import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { queryClient } from '../api/queryClient'

const estiloEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-white ${
    isActive ? 'bg-emerald-950/40 text-white' : 'text-emerald-50 hover:bg-emerald-950/30'
  }`

export const Navbar = () => {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidadEnCarrito = useCartStore((s) => s.items.reduce((suma, i) => suma + i.cantidad, 0))
  const navigate = useNavigate()

  const cerrarSesion = async () => {
    await logout()
    // Se descartan los datos en caché del usuario anterior (pedidos, usuarios, resumen)
    queryClient.clear()
    navigate('/login')
  }

  return (
    <header className="bg-emerald-900 text-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Food Store
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-1">
          <NavLink to="/" end className={estiloEnlace}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={estiloEnlace}>
            Carrito{cantidadEnCarrito > 0 && ` (${cantidadEnCarrito})`}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={estiloEnlace}>
              Mis pedidos
            </NavLink>
          )}
          {usuario?.role === 'admin' && (
            <NavLink to="/admin" className={estiloEnlace}>
              Panel de administración
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">{usuario.full_name}</p>
                <p className="text-xs text-emerald-100">{usuario.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
              </div>
              <button
                type="button"
                onClick={() => void cerrarSesion()}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={estiloEnlace}>
                Ingresar
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

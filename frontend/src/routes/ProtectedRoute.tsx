import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Rol } from '../features/usuarios/types/usuario'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  // Sin roles indicados alcanza con tener sesión
  rolesPermitidos?: Rol[]
}

// Ocultar botones no reemplaza a require_role: la protección real está en el backend
export const ProtectedRoute = ({ rolesPermitidos }: ProtectedRouteProps) => {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <p role="status" className="py-16 text-center text-stone-500">
        Verificando la sesión...
      </p>
    )
  }

  if (!usuario) {
    // Se guarda la ruta pedida para volver a ella después del login
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

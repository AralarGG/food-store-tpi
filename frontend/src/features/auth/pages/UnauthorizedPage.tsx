import { Link } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'

export const UnauthorizedPage = () => (
  <EstadoVacio
    titulo="No tenés permiso para ver esta pantalla"
    mensaje="Esta sección es solo para administradores."
    accion={
      <Link to="/" className="font-semibold text-emerald-800 hover:underline">
        Volver al catálogo
      </Link>
    }
  />
)

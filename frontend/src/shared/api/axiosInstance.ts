import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

// Cliente HTTP único. withCredentials hace que el navegador envíe la cookie HttpOnly de sesión:
// el frontend nunca lee ni guarda el token.
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// En estas rutas un 401 es una respuesta esperada (login fallido o visitante sin sesión)
const RUTAS_SIN_LIMPIEZA = ['/auth/token', '/auth/me']
const MENSAJE_CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const url = error.config?.url ?? ''
      const { status, data } = error.response
      const detail = (data as { detail?: unknown } | undefined)?.detail

      const sesionVencida = status === 401 && !RUTAS_SIN_LIMPIEZA.some((ruta) => url.endsWith(ruta))
      const cuentaDesactivada = status === 400 && detail === MENSAJE_CUENTA_DESACTIVADA

      // Sin usuario en el store, ProtectedRoute redirige a /login
      if (sesionVencida || cuentaDesactivada) {
        useAuthStore.getState().limpiarSesion()
      }
    }
    return Promise.reject(error)
  },
)

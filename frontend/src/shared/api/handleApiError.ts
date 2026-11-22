import axios from 'axios'

interface ErrorValidacion {
  loc: (string | number)[]
  msg: string
}

const esErrorValidacion = (valor: unknown): valor is ErrorValidacion =>
  typeof valor === 'object' && valor !== null && 'msg' in valor && 'loc' in valor

// Convierte cualquier error de una petición en un mensaje para mostrar en pantalla.
// FastAPI devuelve detail como texto en los errores de negocio y como lista en los 422.
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté en ejecución.'
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      const mensajes = detail.filter(esErrorValidacion).map((e) => `${String(e.loc.at(-1))}: ${e.msg}`)
      if (mensajes.length > 0) {
        return `Datos inválidos. ${mensajes.join('. ')}`
      }
    }
    return `Error inesperado del servidor (código ${error.response.status})`
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocurrió un error inesperado.'
}

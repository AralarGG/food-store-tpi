import { axiosInstance } from '../../../shared/api/axiosInstance'
import type { Usuario } from '../../usuarios/types/usuario'
import type { MensajeRespuesta, UserCreate } from '../types/auth'

// El login usa el formulario OAuth2 (application/x-www-form-urlencoded).
// La respuesta no trae el token: el backend lo deja en la cookie HttpOnly.
export const login = async (username: string, password: string): Promise<MensajeRespuesta> => {
  const formulario = new URLSearchParams({ username, password })
  const { data } = await axiosInstance.post<MensajeRespuesta>('/auth/token', formulario)
  return data
}

export const logout = async (): Promise<MensajeRespuesta> => {
  const { data } = await axiosInstance.post<MensajeRespuesta>('/auth/logout')
  return data
}

export const obtenerPerfil = async (): Promise<Usuario> => {
  const { data } = await axiosInstance.get<Usuario>('/auth/me')
  return data
}

export const registrar = async (datos: UserCreate): Promise<Usuario> => {
  const { data } = await axiosInstance.post<Usuario>('/auth/register', datos)
  return data
}

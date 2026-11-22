import { axiosInstance } from '../../../shared/api/axiosInstance'
import type { Usuario } from '../types/usuario'

export const listarUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await axiosInstance.get<Usuario[]>('/admin/usuarios')
  return data
}

export const activarUsuario = async (id: number): Promise<Usuario> => {
  const { data } = await axiosInstance.post<Usuario>(`/admin/usuarios/${id}/activar`)
  return data
}

export const desactivarUsuario = async (id: number): Promise<Usuario> => {
  const { data } = await axiosInstance.post<Usuario>(`/admin/usuarios/${id}/desactivar`)
  return data
}

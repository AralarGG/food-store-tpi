import { axiosInstance } from '../../../shared/api/axiosInstance'
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const listarCategorias = async (): Promise<Categoria[]> => {
  const { data } = await axiosInstance.get<Categoria[]>('/categorias')
  return data
}

export const crearCategoria = async (datos: CategoriaCreate): Promise<Categoria> => {
  const { data } = await axiosInstance.post<Categoria>('/categorias', datos)
  return data
}

export const actualizarCategoria = async (id: number, datos: CategoriaUpdate): Promise<Categoria> => {
  const { data } = await axiosInstance.put<Categoria>(`/categorias/${id}`, datos)
  return data
}

export const eliminarCategoria = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/categorias/${id}`)
}

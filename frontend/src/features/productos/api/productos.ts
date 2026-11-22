import { axiosInstance } from '../../../shared/api/axiosInstance'
import type {
  FiltrosProductos,
  Producto,
  ProductoCreate,
  ProductosPaginados,
  ProductoStockUpdate,
  ProductoUpdate,
} from '../types/producto'

export const listarProductos = async (filtros: FiltrosProductos): Promise<ProductosPaginados> => {
  // Axios omite los parámetros undefined, así solo viajan los filtros elegidos
  const { data } = await axiosInstance.get<ProductosPaginados>('/productos', { params: filtros })
  return data
}

export const crearProducto = async (datos: ProductoCreate): Promise<Producto> => {
  const { data } = await axiosInstance.post<Producto>('/productos', datos)
  return data
}

export const actualizarProducto = async (id: number, datos: ProductoUpdate): Promise<Producto> => {
  const { data } = await axiosInstance.put<Producto>(`/productos/${id}`, datos)
  return data
}

export const actualizarStock = async (id: number, datos: ProductoStockUpdate): Promise<Producto> => {
  const { data } = await axiosInstance.patch<Producto>(`/productos/${id}/stock`, datos)
  return data
}

export const eliminarProducto = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/productos/${id}`)
}

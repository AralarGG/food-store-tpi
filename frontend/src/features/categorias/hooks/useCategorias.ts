import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const useCategorias = () =>
  useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

// Los productos muestran su categoría anidada: al cambiar una categoría también se refresca el catálogo
const useInvalidarCatalogo = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['categorias'] })
    void queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export const useCrearCategoria = () => {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: (datos: CategoriaCreate) => crearCategoria(datos),
    onSuccess: invalidar,
  })
}

export const useActualizarCategoria = () => {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) => actualizarCategoria(id, datos),
    onSuccess: invalidar,
  })
}

export const useEliminarCategoria = () => {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: invalidar,
  })
}

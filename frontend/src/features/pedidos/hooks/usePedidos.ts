import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerPedido,
  obtenerResumen,
} from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from '../types/pedido'

export const usePedidos = (filtros: FiltrosPedidos) =>
  useQuery({
    queryKey: ['pedidos', 'lista', filtros],
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  })

export const usePedido = (id: number | null) =>
  useQuery({
    queryKey: ['pedidos', 'detalle', id],
    queryFn: () => obtenerPedido(id ?? 0),
    enabled: id !== null,
  })

export const useResumenPedidos = () =>
  useQuery({
    queryKey: ['pedidos', 'resumen'],
    queryFn: obtenerResumen,
  })

// Crear o cancelar un pedido cambia el stock: se refrescan los pedidos y el catálogo
const useInvalidarPedidosYStock = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    void queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export const useCrearPedido = () => {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (datos: PedidoCreate) => crearPedido(datos),
    onSuccess: invalidar,
  })
}

export const useCambiarEstadoPedido = () => {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, { estado }),
    onSuccess: invalidar,
  })
}

export const useCancelarPedido = () => {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: invalidar,
  })
}

import { createColumnHelper, getCoreRowModel, useReactTable, type PaginationState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Tabla } from '../../../shared/components/Tabla'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { ETIQUETA_FORMA_PAGO, TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido'

interface PedidosTablaProps {
  pedidos: Pedido[]
  total: number
  paginacion: PaginationState
  onPaginacion: (paginacion: PaginationState) => void
  nombreCliente: (usuarioId: number) => string
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
  ocupado: boolean
}

// Texto del botón para cada estado al que se puede avanzar
const TEXTO_AVANZAR: Partial<Record<EstadoPedido, string>> = {
  EN_PREPARACION: 'Pasar a preparación',
  ENTREGADO: 'Marcar entregado',
}

const columnHelper = createColumnHelper<Pedido>()

export const PedidosTabla = ({
  pedidos,
  total,
  paginacion,
  onPaginacion,
  nombreCliente,
  onVer,
  onCambiarEstado,
  ocupado,
}: PedidosTablaProps) => {
  const columnas = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Pedido',
        cell: (info) => <span className="font-semibold text-stone-900">#{info.getValue()}</span>,
      }),
      columnHelper.accessor('usuario_id', {
        header: 'Cliente',
        cell: (info) => nombreCliente(info.getValue()),
      }),
      columnHelper.accessor('created_at', {
        header: 'Fecha',
        cell: (info) => <span className="whitespace-nowrap">{formatearFecha(info.getValue())}</span>,
      }),
      columnHelper.accessor('forma_pago', {
        header: 'Pago',
        cell: (info) => ETIQUETA_FORMA_PAGO[info.getValue()],
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: (info) => <span className="whitespace-nowrap">{formatearPrecio(info.getValue())}</span>,
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => <BadgeEstado estado={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const pedido = row.original
          // Los botones salen del mismo mapa de transiciones que valida el backend
          const siguientes = TRANSICIONES[pedido.estado]
          return (
            <div className="flex flex-wrap gap-1">
              <Button variante="texto" tamanio="sm" onClick={() => onVer(pedido)}>
                Ver
              </Button>
              {siguientes.map((estado) =>
                estado === 'CANCELADO' ? (
                  <Button
                    key={estado}
                    variante="texto"
                    tamanio="sm"
                    className="text-red-700 hover:bg-red-50"
                    disabled={ocupado}
                    onClick={() => onCambiarEstado(pedido, estado)}
                  >
                    Cancelar
                  </Button>
                ) : (
                  <Button
                    key={estado}
                    variante="secundario"
                    tamanio="sm"
                    disabled={ocupado}
                    onClick={() => onCambiarEstado(pedido, estado)}
                  >
                    {TEXTO_AVANZAR[estado]}
                  </Button>
                ),
              )}
            </div>
          )
        },
      }),
    ],
    [nombreCliente, onVer, onCambiarEstado, ocupado],
  )

  // Paginación del lado del servidor: la tabla solo muestra la página que devolvió la API
  const tabla = useReactTable({
    data: pedidos,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: { pagination: paginacion },
    onPaginationChange: (actualizacion) =>
      onPaginacion(typeof actualizacion === 'function' ? actualizacion(paginacion) : actualizacion),
  })

  return <Tabla tabla={tabla} mensajeVacio="No hay pedidos en este estado." />
}

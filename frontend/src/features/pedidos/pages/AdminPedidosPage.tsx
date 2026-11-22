import type { PaginationState } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Confirmacion } from '../../../shared/components/Confirmacion'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { Modal } from '../../../shared/ui/Modal'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { PedidosTabla } from '../components/PedidosTabla'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ETIQUETA_ESTADO, type EstadoPedido, type Pedido } from '../types/pedido'

const ESTADOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

export const AdminPedidosPage = () => {
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [paginacion, setPaginacion] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const pedidos = usePedidos({
    skip: paginacion.pageIndex * paginacion.pageSize,
    limit: paginacion.pageSize,
    estado: estado || undefined,
  })
  const usuarios = useUsuarios()
  const { mutateAsync: cambiarEstado, isPending: cambiando } = useCambiarEstadoPedido()

  const nombres = useMemo(
    () => new Map((usuarios.data ?? []).map((u) => [u.id, u.username])),
    [usuarios.data],
  )
  const nombreCliente = useCallback((id: number) => nombres.get(id) ?? `Usuario #${id}`, [nombres])

  const aplicarEstado = useCallback(
    async (pedido: Pedido, nuevo: EstadoPedido) => {
      setError(null)
      try {
        await cambiarEstado({ id: pedido.id, estado: nuevo })
        setAviso(
          nuevo === 'CANCELADO'
            ? `Se canceló el pedido #${pedido.id} y se restituyó el stock de sus productos.`
            : `El pedido #${pedido.id} pasó a ${ETIQUETA_ESTADO[nuevo]}.`,
        )
        setACancelar(null)
      } catch (e) {
        setError(handleApiError(e))
      }
    },
    [cambiarEstado],
  )

  // Avanzar es directo; cancelar pide confirmación porque no tiene vuelta atrás
  const onCambiarEstado = useCallback(
    (pedido: Pedido, nuevo: EstadoPedido) => {
      if (nuevo === 'CANCELADO') {
        setError(null)
        setACancelar(pedido)
      } else {
        void aplicarEstado(pedido, nuevo)
      }
    },
    [aplicarEstado],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pedidos</h2>
          {pedidos.data && (
            <p className="text-sm text-stone-500">
              {pedidos.data.total} {pedidos.data.total === 1 ? 'pedido' : 'pedidos'}
              {estado && ` en estado ${ETIQUETA_ESTADO[estado]}`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="filtro-estado-admin" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado-admin"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoPedido | '')
              setPaginacion((p) => ({ ...p, pageIndex: 0 }))
            }}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}
      {error && !aCancelar && <Mensaje tipo="error">{error}</Mensaje>}

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError mensaje={handleApiError(pedidos.error)} onReintentar={() => void pedidos.refetch()} />
      ) : (
        <PedidosTabla
          pedidos={pedidos.data.items}
          total={pedidos.data.total}
          paginacion={paginacion}
          onPaginacion={setPaginacion}
          nombreCliente={nombreCliente}
          onVer={setDetalle}
          onCambiarEstado={onCambiarEstado}
          ocupado={cambiando}
        />
      )}

      {detalle && (
        <Modal titulo={`Pedido #${detalle.id} de ${nombreCliente(detalle.usuario_id)}`} onClose={() => setDetalle(null)} ancho="lg">
          <PedidoDetalle pedidoId={detalle.id} />
        </Modal>
      )}

      {aCancelar && (
        <Confirmacion
          titulo={`Cancelar el pedido #${aCancelar.id}`}
          textoConfirmar="Cancelar pedido"
          onConfirmar={() => void aplicarEstado(aCancelar, 'CANCELADO')}
          onCancelar={() => setACancelar(null)}
          procesando={cambiando}
          error={error}
        >
          <p>
            El pedido de {nombreCliente(aCancelar.usuario_id)} por {formatearPrecio(aCancelar.total)} queda cancelado y el
            stock de sus productos se restituye. Esta acción no se puede deshacer.
          </p>
        </Confirmacion>
      )}
    </div>
  )
}

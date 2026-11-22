import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Confirmacion } from '../../../shared/components/Confirmacion'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { Modal } from '../../../shared/ui/Modal'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import { ETIQUETA_ESTADO, ETIQUETA_FORMA_PAGO, type EstadoPedido, type Pedido } from '../types/pedido'

const PEDIDOS_POR_PAGINA = 10
const ESTADOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

const cantidadProductos = (pedido: Pedido) => pedido.items.reduce((suma, i) => suma + i.cantidad, 0)

export const MisPedidosPage = () => {
  const location = useLocation()
  const pedidoCreado = (location.state as { pedidoCreado?: number } | null)?.pedidoCreado

  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // propios: un admin que entra a "Mis pedidos" ve solo los suyos, no los de todos los clientes
  const pedidos = usePedidos({
    skip: pagina * PEDIDOS_POR_PAGINA,
    limit: PEDIDOS_POR_PAGINA,
    estado: estado || undefined,
    propios: true,
  })
  const cancelar = useCancelarPedido()

  const confirmarCancelacion = async (pedido: Pedido) => {
    setError(null)
    try {
      await cancelar.mutateAsync(pedido.id)
      setAviso(`Cancelaste el pedido #${pedido.id}. El stock de sus productos volvió a quedar disponible.`)
      setACancelar(null)
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const totalPaginas = Math.ceil((pedidos.data?.total ?? 0) / PEDIDOS_POR_PAGINA)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis pedidos</h1>
          <p className="mt-1 text-sm text-stone-500">Podés cancelar un pedido mientras está pendiente.</p>
        </div>
        <div>
          <label htmlFor="filtro-estado" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoPedido | '')
              setPagina(0)
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

      <div className="mt-6 flex flex-col gap-4">
        {pedidoCreado && !aviso && (
          <Mensaje tipo="exito">Tu pedido #{pedidoCreado} quedó registrado y está pendiente de preparación.</Mensaje>
        )}
        {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}

        {pedidos.isPending ? (
          <SkeletonFilas cantidad={4} />
        ) : pedidos.isError ? (
          <EstadoError mensaje={handleApiError(pedidos.error)} onReintentar={() => void pedidos.refetch()} />
        ) : pedidos.data.items.length === 0 ? (
          <EstadoVacio
            titulo={estado ? 'No tenés pedidos en este estado' : 'Todavía no hiciste pedidos'}
            mensaje={estado ? 'Probá con otro estado.' : 'Cuando confirmes un pedido lo vas a ver acá.'}
            accion={
              !estado && (
                <Link to="/" className="font-semibold text-emerald-800 hover:underline">
                  Ir al catálogo
                </Link>
              )
            }
          />
        ) : (
          <>
            <ul className={`flex flex-col gap-3 ${pedidos.isPlaceholderData ? 'opacity-60' : ''}`}>
              {pedidos.data.items.map((pedido) => (
                <li key={pedido.id}>
                  <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                    <div className="min-w-48 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-stone-900">Pedido #{pedido.id}</p>
                        <BadgeEstado estado={pedido.estado} />
                      </div>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatearFecha(pedido.created_at)} | {ETIQUETA_FORMA_PAGO[pedido.forma_pago]} |{' '}
                        {cantidadProductos(pedido)} {cantidadProductos(pedido) === 1 ? 'producto' : 'productos'}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-stone-900">{formatearPrecio(pedido.total)}</p>
                    <div className="flex gap-2">
                      <Button variante="secundario" tamanio="sm" onClick={() => setDetalleId(pedido.id)}>
                        Ver detalle
                      </Button>
                      {pedido.estado === 'PENDIENTE' && (
                        <Button
                          variante="secundario"
                          tamanio="sm"
                          className="text-red-700"
                          onClick={() => {
                            setError(null)
                            setACancelar(pedido)
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Paginacion
              pagina={pagina}
              totalPaginas={totalPaginas}
              onCambiar={setPagina}
              deshabilitada={pedidos.isPlaceholderData}
            />
          </>
        )}
      </div>

      {detalleId !== null && (
        <Modal titulo={`Pedido #${detalleId}`} onClose={() => setDetalleId(null)} ancho="lg">
          <PedidoDetalle pedidoId={detalleId} />
        </Modal>
      )}

      {aCancelar && (
        <Confirmacion
          titulo={`Cancelar el pedido #${aCancelar.id}`}
          textoConfirmar="Cancelar pedido"
          onConfirmar={() => void confirmarCancelacion(aCancelar)}
          onCancelar={() => setACancelar(null)}
          procesando={cancelar.isPending}
          error={error}
        >
          <p>
            El pedido por {formatearPrecio(aCancelar.total)} queda cancelado y no se puede volver a activar. Si querés los
            mismos productos, vas a tener que hacer un pedido nuevo.
          </p>
        </Confirmacion>
      )}
    </div>
  )
}

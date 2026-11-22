import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { usePedido } from '../hooks/usePedidos'
import { ETIQUETA_FORMA_PAGO } from '../types/pedido'

// Detalle de un pedido con sus líneas, obtenido con GET /pedidos/{id}
export const PedidoDetalle = ({ pedidoId }: { pedidoId: number }) => {
  const pedido = usePedido(pedidoId)

  if (pedido.isPending) {
    return <SkeletonFilas cantidad={3} />
  }
  if (pedido.isError) {
    return <EstadoError mensaje={handleApiError(pedido.error)} onReintentar={() => void pedido.refetch()} />
  }

  const { data } = pedido
  return (
    <div className="flex flex-col gap-5 text-sm">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Estado</dt>
          <dd className="mt-0.5">
            <BadgeEstado estado={data.estado} />
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Fecha</dt>
          <dd className="mt-0.5">{formatearFecha(data.created_at)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Dirección de entrega</dt>
          <dd className="mt-0.5">{data.direccion_entrega}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Forma de pago</dt>
          <dd className="mt-0.5">{ETIQUETA_FORMA_PAGO[data.forma_pago]}</dd>
        </div>
        {data.notas && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Notas</dt>
            <dd className="mt-0.5">{data.notas}</dd>
          </div>
        )}
        {data.updated_at !== data.created_at && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Último cambio de estado</dt>
            <dd className="mt-0.5">{formatearFecha(data.updated_at)}</dd>
          </div>
        )}
      </dl>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Producto
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Precio
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Cantidad
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.items.map((item) => (
              <tr key={item.producto_id}>
                <td className="px-3 py-2">{item.nombre_producto}</td>
                <td className="px-3 py-2 text-right">{formatearPrecio(item.precio_unitario)}</td>
                <td className="px-3 py-2 text-right">{item.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatearPrecio(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200 font-bold">
            <tr>
              <td colSpan={3} className="px-3 py-2">
                Total
              </td>
              <td className="px-3 py-2 text-right">{formatearPrecio(data.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

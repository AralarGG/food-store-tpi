import { ETIQUETA_ESTADO, type EstadoPedido } from '../../features/pedidos/types/pedido'

const colores: Record<EstadoPedido, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-900',
  EN_PREPARACION: 'bg-sky-100 text-sky-900',
  ENTREGADO: 'bg-emerald-100 text-emerald-900',
  CANCELADO: 'bg-stone-200 text-stone-700',
}

export const BadgeEstado = ({ estado }: { estado: EstadoPedido }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${colores[estado]}`}>
    {ETIQUETA_ESTADO[estado]}
  </span>
)

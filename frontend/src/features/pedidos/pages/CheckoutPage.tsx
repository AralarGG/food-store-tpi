import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm, type DatosEntrega } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export const CheckoutPage = () => {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay productos para confirmar"
        mensaje="Agregá productos al carrito antes de confirmar el pedido."
        accion={
          <Link to="/" className="font-semibold text-emerald-800 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  const confirmar = async (datos: DatosEntrega) => {
    setError(null)
    try {
      const pedido = await crearPedido.mutateAsync({
        items: items.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad })),
        ...datos,
      })
      navigate('/mis-pedidos', { state: { pedidoCreado: pedido.id } })
      vaciar()
    } catch (e) {
      // Por ejemplo, si otro cliente compró el último producto mientras tanto: el carrito se conserva
      setError(handleApiError(e))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Confirmar pedido</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6">
          <CheckoutForm total={total} error={error} onSubmit={confirmar} />
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-stone-900">Tu pedido</h2>
            <Link to="/carrito" className="text-sm font-medium text-emerald-800 hover:underline">
              Modificar
            </Link>
          </div>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.producto_id} className="flex justify-between gap-3">
                <span className="text-stone-700">
                  {item.cantidad} x {item.nombre}
                </span>
                <span className="shrink-0">{formatearPrecio(item.precio_unitario * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-stone-100 pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

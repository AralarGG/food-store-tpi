import { Link, useNavigate } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'

const estiloBotonCantidad =
  'flex size-8 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40'

export const CarritoPage = () => {
  const items = useCartStore((s) => s.items)
  const quitar = useCartStore((s) => s.quitar)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo para armar tu pedido."
        accion={
          <Link to="/" className="font-semibold text-emerald-800 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Carrito</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.producto_id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-40 flex-1">
                <p className="font-semibold text-stone-900">{item.nombre}</p>
                <p className="text-sm text-stone-500">{formatearPrecio(item.precio_unitario)} c/u</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={estiloBotonCantidad}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                  disabled={item.cantidad <= 1}
                  aria-label={`Quitar una unidad de ${item.nombre}`}
                >
                  -
                </button>
                <label htmlFor={`cantidad-${item.producto_id}`} className="sr-only">
                  Cantidad de {item.nombre}
                </label>
                <input
                  id={`cantidad-${item.producto_id}`}
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.cantidad}
                  onChange={(e) => {
                    const cantidad = Number(e.target.value)
                    if (Number.isInteger(cantidad) && cantidad >= 1) cambiarCantidad(item.producto_id, cantidad)
                  }}
                  className="w-16 rounded-md border border-stone-300 px-2 py-1 text-center text-sm"
                />
                <button
                  type="button"
                  className={estiloBotonCantidad}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                  disabled={item.cantidad >= item.stock}
                  aria-label={`Agregar una unidad de ${item.nombre}`}
                >
                  +
                </button>
              </div>

              <p className="w-28 text-right font-semibold text-stone-900">
                {formatearPrecio(item.precio_unitario * item.cantidad)}
              </p>

              <Button
                variante="texto"
                tamanio="sm"
                className="text-red-700 hover:bg-red-50"
                onClick={() => quitar(item.producto_id)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="font-semibold text-stone-900">Resumen</h2>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">Productos</dt>
              <dd>{items.reduce((suma, i) => suma + i.cantidad, 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatearPrecio(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-stone-500">
            Los precios se confirman al crear el pedido y no cambian después.
          </p>
          <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
            Confirmar pedido
          </Button>
          <div className="mt-3 flex justify-between">
            <Link to="/" className="text-sm font-medium text-emerald-800 hover:underline">
              Seguir comprando
            </Link>
            <button type="button" onClick={vaciar} className="text-sm font-medium text-stone-500 hover:text-red-700">
              Vaciar carrito
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

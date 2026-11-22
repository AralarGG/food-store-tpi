import { formatearPrecio } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import type { Producto } from '../types/producto'

interface ProductoCardProps {
  producto: Producto
  cantidadEnCarrito: number
  onAgregar: (producto: Producto) => void
}

export const ProductoCard = ({ producto, cantidadEnCarrito, onAgregar }: ProductoCardProps) => {
  const sinStock = producto.stock === 0
  const llegoAlStock = cantidadEnCarrito >= producto.stock
  const puedeAgregar = producto.disponible && !sinStock && !llegoAlStock

  let aviso: string | null = null
  if (!producto.disponible) aviso = 'No disponible'
  else if (sinStock) aviso = 'Sin stock'
  else if (producto.stock <= 5) aviso = `Últimas ${producto.stock} unidades`

  return (
    <Card className="flex flex-col overflow-hidden">
      {producto.imagen_url ? (
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          loading="lazy"
          className="aspect-[4/3] w-full bg-stone-100 object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-emerald-50 px-4 text-center">
          <span className="text-lg font-semibold text-emerald-900/70">{producto.categoria.nombre}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-stone-500">{producto.categoria.nombre}</p>
        <h2 className="mt-0.5 font-semibold text-stone-900">{producto.nombre}</h2>
        {producto.descripcion && <p className="mt-1 text-sm leading-snug text-stone-600">{producto.descripcion}</p>}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-stone-900">{formatearPrecio(producto.precio_base)}</p>
            {aviso && (
              <p className={`text-xs font-semibold ${puedeAgregar ? 'text-amber-800' : 'text-stone-500'}`}>{aviso}</p>
            )}
          </div>
          <Button className="mt-3 w-full" onClick={() => onAgregar(producto)} disabled={!puedeAgregar}>
            Agregar al carrito
          </Button>
          {cantidadEnCarrito > 0 && (
            <p className="mt-2 text-center text-xs text-emerald-800">
              {llegoAlStock ? 'Ya agregaste todo el stock disponible' : `En el carrito: ${cantidadEnCarrito}`}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

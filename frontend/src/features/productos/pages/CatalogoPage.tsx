import { useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonTarjetas } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { useCartStore } from '../../../store/cartStore'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'
import type { Producto } from '../types/producto'

const PRODUCTOS_POR_PAGINA = 8

const estiloControl =
  'rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 focus:outline-none'

export const CatalogoPage = () => {
  const [pagina, setPagina] = useState(0)
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [soloDisponibles, setSoloDisponibles] = useState(false)

  // La paginación es del lado del servidor: skip = página x límite
  const productos = useProductos({
    skip: pagina * PRODUCTOS_POR_PAGINA,
    limit: PRODUCTOS_POR_PAGINA,
    search: busqueda || undefined,
    categoria_id: categoriaId,
    disponible: soloDisponibles ? true : undefined,
  })
  const categorias = useCategorias()

  const itemsCarrito = useCartStore((s) => s.items)
  const agregar = useCartStore((s) => s.agregar)
  const [ultimoAgregado, setUltimoAgregado] = useState<string | null>(null)

  const agregarAlCarrito = (producto: Producto) => {
    agregar({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: producto.precio_base,
      stock: producto.stock,
    })
    setUltimoAgregado(producto.nombre)
  }

  const buscar = (texto: string) => {
    setBusqueda(texto.trim())
    setPagina(0)
  }

  const hayFiltros = busqueda !== '' || categoriaId !== undefined || soloDisponibles
  const limpiarFiltros = () => {
    setTextoBusqueda('')
    setBusqueda('')
    setCategoriaId(undefined)
    setSoloDisponibles(false)
    setPagina(0)
  }

  const total = productos.data?.total ?? 0
  const totalPaginas = Math.ceil(total / PRODUCTOS_POR_PAGINA)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="mt-1 text-sm text-stone-500">
            {productos.data ? `${total} ${total === 1 ? 'producto' : 'productos'}` : 'Elegí lo que quieras pedir.'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <form
          role="search"
          className="flex min-w-64 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            buscar(textoBusqueda)
          }}
        >
          <label htmlFor="busqueda" className="sr-only">
            Buscar productos por nombre
          </label>
          <input
            id="busqueda"
            type="search"
            value={textoBusqueda}
            onChange={(e) => {
              setTextoBusqueda(e.target.value)
              // Al borrar el texto se vuelve a mostrar todo sin tener que apretar Buscar
              if (e.target.value === '' && busqueda !== '') buscar('')
            }}
            placeholder="Buscar por nombre"
            className={`${estiloControl} flex-1`}
          />
          <Button type="submit" variante="secundario">
            Buscar
          </Button>
        </form>

        <div>
          <label htmlFor="categoria" className="sr-only">
            Filtrar por categoría
          </label>
          <select
            id="categoria"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value === '' ? undefined : Number(e.target.value))
              setPagina(0)
            }}
            className={estiloControl}
          >
            <option value="">Todas las categorías</option>
            {categorias.data?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 py-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(e) => {
              setSoloDisponibles(e.target.checked)
              setPagina(0)
            }}
            className="size-4 accent-emerald-800"
          />
          Solo disponibles
        </label>

        {hayFiltros && (
          <Button variante="texto" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {ultimoAgregado && (
        <p role="status" className="mt-4 text-sm text-emerald-800">
          Agregaste {ultimoAgregado} al carrito.
        </p>
      )}

      <section className="mt-6" aria-live="polite">
        {productos.isPending ? (
          <SkeletonTarjetas cantidad={PRODUCTOS_POR_PAGINA} />
        ) : productos.isError ? (
          <EstadoError mensaje={handleApiError(productos.error)} onReintentar={() => void productos.refetch()} />
        ) : productos.data.items.length === 0 ? (
          <EstadoVacio
            titulo={hayFiltros ? 'No hay productos que coincidan' : 'Todavía no hay productos'}
            mensaje={hayFiltros ? 'Probá con otra búsqueda o con otra categoría.' : 'Cuando se carguen productos van a aparecer acá.'}
            accion={hayFiltros && <Button variante="secundario" onClick={limpiarFiltros}>Ver todos los productos</Button>}
          />
        ) : (
          <div className={`flex flex-col gap-6 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productos.data.items.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  cantidadEnCarrito={itemsCarrito.find((i) => i.producto_id === producto.id)?.cantidad ?? 0}
                  onAgregar={agregarAlCarrito}
                />
              ))}
            </div>
            <Paginacion
              pagina={pagina}
              totalPaginas={totalPaginas}
              onCambiar={setPagina}
              deshabilitada={productos.isPlaceholderData}
            />
          </div>
        )}
      </section>
    </div>
  )
}

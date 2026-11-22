import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Confirmacion } from '../../../shared/components/Confirmacion'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Tabla } from '../../../shared/components/Tabla'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { Modal } from '../../../shared/ui/Modal'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'baja'; producto: Producto }

const columnHelper = createColumnHelper<Producto>()

export const AdminProductosPage = () => {
  // El panel trae hasta 100 productos y pagina del lado del cliente con TanStack Table
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  const abrir = (nuevo: Dialogo) => {
    setError(null)
    setDialogo(nuevo)
  }

  const cerrar = () => {
    setDialogo(null)
    setError(null)
  }

  const terminar = (mensaje: string) => {
    setAviso(mensaje)
    cerrar()
  }

  const guardarProducto = async (datos: ProductoCreate) => {
    try {
      if (dialogo?.tipo === 'editar') {
        const original = dialogo.producto
        // La categoría se envía solo si cambió: si era una dada de baja, el backend la rechazaría
        const { categoria_id, ...resto } = datos
        await actualizar.mutateAsync({
          id: original.id,
          datos: categoria_id === original.categoria_id ? resto : datos,
        })
        terminar(`Se guardaron los cambios de ${datos.nombre}.`)
      } else {
        await crear.mutateAsync(datos)
        terminar(`Se creó el producto ${datos.nombre}.`)
      }
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const guardarStock = async (producto: Producto, datos: ProductoStockUpdate) => {
    try {
      await actualizarStock.mutateAsync({ id: producto.id, datos })
      terminar(`Se actualizó el stock de ${producto.nombre}.`)
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const darDeBaja = async (producto: Producto) => {
    try {
      await eliminar.mutateAsync(producto.id)
      terminar(`Se dio de baja ${producto.nombre}.`)
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const columnas = useMemo(
    () => [
      columnHelper.accessor('nombre', {
        header: 'Producto',
        cell: (info) => <span className="font-medium text-stone-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor((producto) => producto.categoria.nombre, {
        id: 'categoria',
        header: 'Categoría',
        cell: (info) => (
          <span className={info.row.original.categoria.activo ? '' : 'text-stone-400'}>
            {info.getValue()}
            {!info.row.original.categoria.activo && ' (dada de baja)'}
          </span>
        ),
      }),
      columnHelper.accessor('precio_base', {
        header: 'Precio',
        cell: (info) => formatearPrecio(info.getValue()),
      }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: (info) => (
          <span className={info.getValue() === 0 ? 'font-semibold text-red-700' : ''}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('disponible', {
        header: 'Venta',
        enableGlobalFilter: false,
        cell: (info) =>
          info.getValue() ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              Disponible
            </span>
          ) : (
            <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              No disponible
            </span>
          ),
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variante="texto" tamanio="sm" onClick={() => abrir({ tipo: 'editar', producto: row.original })}>
              Editar
            </Button>
            <Button variante="texto" tamanio="sm" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button
              variante="texto"
              tamanio="sm"
              className="text-red-700 hover:bg-red-50"
              onClick={() => abrir({ tipo: 'baja', producto: row.original })}
            >
              Dar de baja
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const datos = useMemo(() => productos.data?.items ?? [], [productos.data])

  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { globalFilter: filtro },
    onGlobalFilterChange: setFiltro,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    // Al editar un producto se conserva la página en la que estaba el admin
    autoResetPageIndex: false,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Productos</h2>
          {productos.data && (
            <p className="text-sm text-stone-500">
              {productos.data.total} {productos.data.total === 1 ? 'producto activo' : 'productos activos'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="filtro-productos" className="sr-only">
            Filtrar productos
          </label>
          <input
            id="filtro-productos"
            type="search"
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value)
              tabla.setPageIndex(0)
            }}
            placeholder="Filtrar por nombre o categoría"
            className="w-64 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
          />
          <Button onClick={() => abrir({ tipo: 'crear' })} disabled={!categorias.data}>
            Nuevo producto
          </Button>
        </div>
      </div>

      {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}

      {productos.isPending ? (
        <SkeletonFilas />
      ) : productos.isError ? (
        <EstadoError mensaje={handleApiError(productos.error)} onReintentar={() => void productos.refetch()} />
      ) : (
        <Tabla tabla={tabla} mensajeVacio={filtro ? 'Ningún producto coincide con el filtro.' : 'Todavía no hay productos.'} />
      )}

      {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
        <Modal titulo={dialogo.tipo === 'crear' ? 'Nuevo producto' : 'Editar producto'} onClose={cerrar} ancho="lg">
          <ProductoForm
            producto={dialogo.tipo === 'editar' ? dialogo.producto : null}
            categorias={categorias.data ?? []}
            error={error}
            onSubmit={guardarProducto}
            onCancel={cerrar}
          />
        </Modal>
      )}

      {dialogo?.tipo === 'stock' && (
        <Modal titulo="Stock y disponibilidad" onClose={cerrar}>
          <StockForm
            producto={dialogo.producto}
            error={error}
            onSubmit={(datos) => guardarStock(dialogo.producto, datos)}
            onCancel={cerrar}
          />
        </Modal>
      )}

      {dialogo?.tipo === 'baja' && (
        <Confirmacion
          titulo="Dar de baja el producto"
          textoConfirmar="Dar de baja"
          onConfirmar={() => void darDeBaja(dialogo.producto)}
          onCancelar={cerrar}
          procesando={eliminar.isPending}
          error={error}
        >
          <p>
            <span className="font-semibold">{dialogo.producto.nombre}</span> deja de aparecer en el catálogo y ya no se
            puede pedir. Los pedidos que ya lo incluyen no cambian.
          </p>
        </Confirmacion>
      )}
    </div>
  )
}

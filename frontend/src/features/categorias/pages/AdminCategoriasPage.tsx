import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Confirmacion } from '../../../shared/components/Confirmacion'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Tabla } from '../../../shared/components/Tabla'
import { Button } from '../../../shared/ui/Button'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types/categoria'

type Dialogo = { tipo: 'crear' } | { tipo: 'editar'; categoria: Categoria } | { tipo: 'baja'; categoria: Categoria }

const columnHelper = createColumnHelper<Categoria>()

export const AdminCategoriasPage = () => {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const abrir = (nuevo: Dialogo) => {
    setError(null)
    setDialogo(nuevo)
  }

  const cerrar = () => {
    setDialogo(null)
    setError(null)
  }

  const guardar = async (datos: CategoriaCreate) => {
    try {
      if (dialogo?.tipo === 'editar') {
        await actualizar.mutateAsync({ id: dialogo.categoria.id, datos })
        setAviso(`Se guardaron los cambios de ${datos.nombre}.`)
      } else {
        await crear.mutateAsync(datos)
        setAviso(`Se creó la categoría ${datos.nombre}.`)
      }
      cerrar()
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const darDeBaja = async (categoria: Categoria) => {
    try {
      await eliminar.mutateAsync(categoria.id)
      setAviso(`Se dio de baja la categoría ${categoria.nombre}.`)
      cerrar()
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const columnas = useMemo(
    () => [
      columnHelper.accessor('nombre', {
        header: 'Nombre',
        cell: (info) => <span className="font-medium text-stone-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('descripcion', {
        header: 'Descripción',
        cell: (info) => info.getValue() || <span className="text-stone-400">Sin descripción</span>,
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variante="texto" tamanio="sm" onClick={() => abrir({ tipo: 'editar', categoria: row.original })}>
              Editar
            </Button>
            <Button
              variante="texto"
              tamanio="sm"
              className="text-red-700 hover:bg-red-50"
              onClick={() => abrir({ tipo: 'baja', categoria: row.original })}
            >
              Dar de baja
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const datos = useMemo(() => categorias.data ?? [], [categorias.data])

  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    autoResetPageIndex: false,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Categorías</h2>
          {categorias.data && (
            <p className="text-sm text-stone-500">
              {categorias.data.length} {categorias.data.length === 1 ? 'categoría activa' : 'categorías activas'}
            </p>
          )}
        </div>
        <Button onClick={() => abrir({ tipo: 'crear' })}>Nueva categoría</Button>
      </div>

      {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError mensaje={handleApiError(categorias.error)} onReintentar={() => void categorias.refetch()} />
      ) : (
        <Tabla tabla={tabla} mensajeVacio="Todavía no hay categorías." />
      )}

      {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
        <Modal titulo={dialogo.tipo === 'crear' ? 'Nueva categoría' : 'Editar categoría'} onClose={cerrar}>
          <CategoriaForm
            categoria={dialogo.tipo === 'editar' ? dialogo.categoria : null}
            error={error}
            onSubmit={guardar}
            onCancel={cerrar}
          />
        </Modal>
      )}

      {dialogo?.tipo === 'baja' && (
        <Confirmacion
          titulo="Dar de baja la categoría"
          textoConfirmar="Dar de baja"
          onConfirmar={() => void darDeBaja(dialogo.categoria)}
          onCancelar={cerrar}
          procesando={eliminar.isPending}
          error={error}
        >
          <p>
            <span className="font-semibold">{dialogo.categoria.nombre}</span> deja de aparecer en el listado de
            categorías. Sus productos siguen a la venta y el nombre queda reservado: para retirarlos del catálogo, dalos
            de baja desde Productos.
          </p>
        </Confirmacion>
      )}
    </div>
  )
}

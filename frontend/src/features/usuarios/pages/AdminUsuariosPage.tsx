import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Tabla } from '../../../shared/components/Tabla'
import { formatearFecha } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { useAuthStore } from '../../../store/authStore'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { Usuario } from '../types/usuario'

const columnHelper = createColumnHelper<Usuario>()

export const AdminUsuariosPage = () => {
  const usuarios = useUsuarios()
  const { mutateAsync: activar } = useActivarUsuario()
  const { mutateAsync: desactivar } = useDesactivarUsuario()
  const idSesion = useAuthStore((s) => s.usuario?.id)
  const [error, setError] = useState<string | null>(null)

  const columnas = useMemo(() => {
    const cambiarEstado = async (usuario: Usuario) => {
      setError(null)
      try {
        if (usuario.disabled) {
          await activar(usuario.id)
        } else {
          await desactivar(usuario.id)
        }
      } catch (e) {
        setError(handleApiError(e))
      }
    }

    return [
      columnHelper.accessor('username', {
        header: 'Usuario',
        cell: (info) => <span className="font-medium text-stone-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('full_name', { header: 'Nombre' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('role', {
        header: 'Rol',
        cell: (info) => (info.getValue() === 'admin' ? 'Administrador' : 'Cliente'),
      }),
      columnHelper.accessor('disabled', {
        header: 'Estado',
        cell: (info) =>
          info.getValue() ? (
            <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              Desactivado
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              Activo
            </span>
          ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Alta',
        cell: (info) => <span className="whitespace-nowrap text-stone-600">{formatearFecha(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const usuario = row.original
          if (usuario.disabled) {
            return (
              <Button variante="texto" tamanio="sm" onClick={() => void cambiarEstado(usuario)}>
                Activar
              </Button>
            )
          }
          // El admin no puede desactivarse a sí mismo: en su propia fila no se muestra el botón
          if (usuario.id === idSesion) {
            return <span className="text-xs text-stone-400">Tu cuenta</span>
          }
          return (
            <Button
              variante="texto"
              tamanio="sm"
              className="text-red-700 hover:bg-red-50"
              onClick={() => void cambiarEstado(usuario)}
            >
              Desactivar
            </Button>
          )
        },
      }),
    ]
  }, [activar, desactivar, idSesion])

  const datos = useMemo(() => usuarios.data ?? [], [usuarios.data])

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
      <div>
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <p className="text-sm text-stone-500">
          Un usuario desactivado no puede iniciar sesión ni operar hasta que se lo vuelva a activar.
        </p>
      </div>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError mensaje={handleApiError(usuarios.error)} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <Tabla tabla={tabla} mensajeVacio="No hay usuarios registrados." />
      )}
    </div>
  )
}

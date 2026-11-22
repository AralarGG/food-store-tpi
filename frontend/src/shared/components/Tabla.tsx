import { flexRender, type Table } from '@tanstack/react-table'
import { Paginacion } from './Paginacion'

interface TablaProps<T> {
  tabla: Table<T>
  mensajeVacio: string
}

// Dibuja cualquier tabla armada con useReactTable, con la paginación del lado del cliente
export const Tabla = <T,>({ tabla, mensajeVacio }: TablaProps<T>) => {
  const filas = tabla.getRowModel().rows
  const { pageIndex } = tabla.getState().pagination

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={tabla.getAllLeafColumns().length} className="px-4 py-10 text-center text-stone-500">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id} className="hover:bg-stone-50">
                  {fila.getVisibleCells().map((celda) => (
                    <td key={celda.id} className="px-4 py-3 align-middle">
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Paginacion pagina={pageIndex} totalPaginas={tabla.getPageCount()} onCambiar={(p) => tabla.setPageIndex(p)} />
    </div>
  )
}

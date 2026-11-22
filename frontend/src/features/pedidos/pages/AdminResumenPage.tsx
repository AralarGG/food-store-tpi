import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { ResumenCard } from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/usePedidos'

export const AdminResumenPage = () => {
  const resumen = useResumenPedidos()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Resumen del negocio</h2>
          <p className="text-sm text-stone-500">Cantidad de pedidos por estado e ingresos de los pedidos entregados.</p>
        </div>
        <Button variante="secundario" onClick={() => void resumen.refetch()} disabled={resumen.isFetching}>
          {resumen.isFetching ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {resumen.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : resumen.isError ? (
        <EstadoError mensaje={handleApiError(resumen.error)} onReintentar={() => void resumen.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard
            titulo="Ingresos de pedidos entregados"
            valor={formatearPrecio(resumen.data.ingresos_entregados)}
            acento="border-l-emerald-700"
          />
          <ResumenCard
            titulo="Pedidos de hoy"
            valor={String(resumen.data.pedidos_hoy)}
            detalle="Creados desde las 00:00, en cualquier estado"
            acento="border-l-stone-400"
          />
          <ResumenCard titulo="Pendientes" valor={String(resumen.data.pendientes)} acento="border-l-amber-400" />
          <ResumenCard titulo="En preparación" valor={String(resumen.data.en_preparacion)} acento="border-l-sky-400" />
          <ResumenCard titulo="Entregados" valor={String(resumen.data.entregados)} acento="border-l-emerald-400" />
          <ResumenCard titulo="Cancelados" valor={String(resumen.data.cancelados)} acento="border-l-stone-300" />
        </div>
      )}
    </div>
  )
}

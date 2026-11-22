import { Button } from '../ui/Button'

interface EstadoErrorProps {
  titulo?: string
  mensaje: string
  onReintentar?: () => void
}

export const EstadoError = ({ titulo = 'No se pudieron cargar los datos', mensaje, onReintentar }: EstadoErrorProps) => (
  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
    <p className="font-semibold text-red-800">{titulo}</p>
    <p className="mt-1 text-sm text-red-700">{mensaje}</p>
    {onReintentar && (
      <Button variante="secundario" className="mt-4" onClick={onReintentar}>
        Reintentar
      </Button>
    )}
  </div>
)

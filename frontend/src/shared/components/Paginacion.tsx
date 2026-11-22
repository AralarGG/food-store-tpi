import { Button } from '../ui/Button'

interface PaginacionProps {
  // Página actual, contada desde 0
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  deshabilitada?: boolean
}

export const Paginacion = ({ pagina, totalPaginas, onCambiar, deshabilitada = false }: PaginacionProps) => {
  if (totalPaginas <= 1) {
    return null
  }
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4">
      <Button variante="secundario" tamanio="sm" onClick={() => onCambiar(pagina - 1)} disabled={deshabilitada || pagina === 0}>
        Anterior
      </Button>
      <p className="text-sm text-stone-600">
        Página {pagina + 1} de {totalPaginas}
      </p>
      <Button
        variante="secundario"
        tamanio="sm"
        onClick={() => onCambiar(pagina + 1)}
        disabled={deshabilitada || pagina >= totalPaginas - 1}
      >
        Siguiente
      </Button>
    </nav>
  )
}

import type { ReactNode } from 'react'

type Tipo = 'error' | 'exito' | 'info'

const estilos: Record<Tipo, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-stone-200 bg-stone-100 text-stone-700',
}

// Aviso dentro de la página: errores de una acción o confirmaciones
export const Mensaje = ({ tipo, children }: { tipo: Tipo; children: ReactNode }) => (
  <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${estilos[tipo]}`}>
    {children}
  </div>
)

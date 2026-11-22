import type { ReactNode } from 'react'

interface EstadoVacioProps {
  titulo: string
  mensaje?: string
  accion?: ReactNode
}

export const EstadoVacio = ({ titulo, mensaje, accion }: EstadoVacioProps) => (
  <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
    <p className="font-semibold text-stone-800">{titulo}</p>
    {mensaje && <p className="mt-1 text-sm text-stone-500">{mensaje}</p>}
    {accion && <div className="mt-5 flex justify-center">{accion}</div>}
  </div>
)

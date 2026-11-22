import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'texto'
type Tamanio = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanio?: Tamanio
}

const estilosVariante: Record<Variante, string> = {
  primario: 'bg-emerald-800 text-white hover:bg-emerald-900',
  secundario: 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100',
  peligro: 'bg-red-700 text-white hover:bg-red-800',
  texto: 'text-emerald-800 hover:bg-emerald-50',
}

const estilosTamanio: Record<Tamanio, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

export const Button = ({ variante = 'primario', tamanio = 'md', className = '', type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${estilosVariante[variante]} ${estilosTamanio[tamanio]} ${className}`}
    {...props}
  />
)

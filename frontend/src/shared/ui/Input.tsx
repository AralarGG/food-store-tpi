import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const estiloCampo =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:bg-stone-100'

const estiloCampoConError = 'border-red-400 focus:border-red-600 focus:ring-red-100'

interface CampoProps {
  id: string
  label: string
  error?: string
  ayuda?: string
  children: ReactNode
}

// Etiqueta, control y mensaje de error con el mismo formato en todos los formularios
const Campo = ({ id, label, error, ayuda, children }: CampoProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-stone-700">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="text-sm text-red-700">
        {error}
      </p>
    ) : (
      ayuda && <p className="text-xs text-stone-500">{ayuda}</p>
    )}
  </div>
)

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  ayuda?: string
}

export const Input = ({ id, label, error, ayuda, className = '', ...props }: InputProps) => (
  <Campo id={id} label={label} error={error} ayuda={ayuda}>
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${estiloCampo} ${error ? estiloCampoConError : ''} ${className}`}
      {...props}
    />
  </Campo>
)

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
  ayuda?: string
}

export const Textarea = ({ id, label, error, ayuda, className = '', ...props }: TextareaProps) => (
  <Campo id={id} label={label} error={error} ayuda={ayuda}>
    <textarea
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${estiloCampo} ${error ? estiloCampoConError : ''} ${className}`}
      {...props}
    />
  </Campo>
)

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
}

export const Select = ({ id, label, error, className = '', children, ...props }: SelectProps) => (
  <Campo id={id} label={label} error={error}>
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${estiloCampo} ${error ? estiloCampoConError : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  </Campo>
)

// TanStack Form guarda los errores de un campo en una lista: se muestra el primero, solo si el campo fue tocado
export const primerError = (meta: { isTouched: boolean; errors: unknown[] }): string | undefined => {
  if (!meta.isTouched) {
    return undefined
  }
  const error = meta.errors.find((e) => typeof e === 'string')
  return typeof error === 'string' ? error : undefined
}

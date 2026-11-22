import type { ReactNode } from 'react'

interface ModalProps {
  titulo: string
  onClose: () => void
  children: ReactNode
  ancho?: 'md' | 'lg'
}

export const Modal = ({ titulo, onClose, children, ancho = 'md' }: ModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 sm:items-center"
    onKeyDown={(e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal"
      className={`my-8 w-full rounded-xl bg-white p-6 shadow-xl ${ancho === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="titulo-modal" className="text-xl font-semibold text-stone-900">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          Cerrar
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  </div>
)

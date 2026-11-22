import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Mensaje } from '../ui/Mensaje'
import { Modal } from '../ui/Modal'

interface ConfirmacionProps {
  titulo: string
  children: ReactNode
  textoConfirmar: string
  onConfirmar: () => void
  onCancelar: () => void
  procesando?: boolean
  error?: string | null
  peligro?: boolean
}

// Diálogo para confirmar acciones que no se deshacen fácilmente (bajas, cancelaciones)
export const Confirmacion = ({
  titulo,
  children,
  textoConfirmar,
  onConfirmar,
  onCancelar,
  procesando = false,
  error = null,
  peligro = true,
}: ConfirmacionProps) => (
  <Modal titulo={titulo} onClose={onCancelar}>
    <div className="text-sm leading-relaxed text-stone-700">{children}</div>
    {error && (
      <div className="mt-4">
        <Mensaje tipo="error">{error}</Mensaje>
      </div>
    )}
    <div className="mt-6 flex justify-end gap-3">
      <Button variante="secundario" onClick={onCancelar} disabled={procesando}>
        Volver
      </Button>
      <Button variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar} disabled={procesando} autoFocus>
        {procesando ? 'Procesando...' : textoConfirmar}
      </Button>
    </div>
  </Modal>
)

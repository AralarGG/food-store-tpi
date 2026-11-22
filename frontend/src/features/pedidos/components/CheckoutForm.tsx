import { useForm } from '@tanstack/react-form'
import { formatearPrecio } from '../../../shared/utils/formato'
import { Button } from '../../../shared/ui/Button'
import { Input, primerError, Textarea } from '../../../shared/ui/Input'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { ETIQUETA_FORMA_PAGO, type FormaPago } from '../types/pedido'

export interface DatosEntrega {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string | null
}

interface CheckoutFormProps {
  total: number
  error: string | null
  onSubmit: (datos: DatosEntrega) => Promise<void>
}

const FORMAS_PAGO: FormaPago[] = ['EFECTIVO', 'TRANSFERENCIA']

export const CheckoutForm = ({ total, error, onSubmit }: CheckoutFormProps) => {
  const form = useForm({
    defaultValues: {
      direccion_entrega: '',
      forma_pago: 'EFECTIVO' as FormaPago,
      notas: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        direccion_entrega: value.direccion_entrega.trim(),
        forma_pago: value.forma_pago,
        notas: value.notas.trim() || null,
      })
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const limpio = value.trim()
            if (limpio.length < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (limpio.length > 200) return 'La dirección puede tener hasta 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Dirección de entrega"
            placeholder="Calle, número, piso y departamento"
            autoComplete="street-address"
            autoFocus
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <fieldset>
            <legend className="text-sm font-medium text-stone-700">Forma de pago</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FORMAS_PAGO.map((forma) => (
                <label
                  key={forma}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                    field.state.value === forma ? 'border-emerald-700 bg-emerald-50' : 'border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={forma}
                    checked={field.state.value === forma}
                    onChange={() => field.handleChange(forma)}
                    className="accent-emerald-800"
                  />
                  {ETIQUETA_FORMA_PAGO[forma]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">
              El pago se hace al recibir el pedido o por transferencia; no se cobra en línea.
            </p>
          </fieldset>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{
          onChange: ({ value }) => (value.trim().length > 500 ? 'Las notas pueden tener hasta 500 caracteres' : undefined),
        }}
      >
        {(field) => (
          <Textarea
            id={field.name}
            label="Notas para el pedido (opcional)"
            rows={3}
            placeholder="Ej: tocar el timbre del 2B"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(enviando) => (
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Confirmando...' : `Confirmar pedido por ${formatearPrecio(total)}`}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

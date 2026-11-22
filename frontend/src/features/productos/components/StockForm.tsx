import { useForm } from '@tanstack/react-form'
import { Button } from '../../../shared/ui/Button'
import { Input, primerError } from '../../../shared/ui/Input'
import { Mensaje } from '../../../shared/ui/Mensaje'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  error: string | null
  onSubmit: (datos: ProductoStockUpdate) => Promise<void>
  onCancel: () => void
}

export const StockForm = ({ producto, error, onSubmit, onCancel }: StockFormProps) => {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      await onSubmit({ stock: Number(value.stock), disponible: value.disponible })
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <p className="text-sm text-stone-600">
        Stock actual de <span className="font-semibold text-stone-900">{producto.nombre}</span>: {producto.stock}{' '}
        {producto.stock === 1 ? 'unidad' : 'unidades'}.
      </p>

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            if (value.trim() === '') return 'Completá el stock'
            const numero = Number(value)
            if (!Number.isInteger(numero)) return 'Ingresá un número entero'
            if (numero < 0) return 'El stock no puede ser negativo'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Nuevo stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            autoFocus
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-emerald-800"
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      <div className="mt-2 flex justify-end gap-3">
        <Button variante="secundario" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(enviando) => (
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar stock'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

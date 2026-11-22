import { useForm } from '@tanstack/react-form'
import { Button } from '../../../shared/ui/Button'
import { Input, primerError, Textarea } from '../../../shared/ui/Input'
import { Mensaje } from '../../../shared/ui/Mensaje'
import type { Categoria, CategoriaCreate } from '../types/categoria'

interface CategoriaFormProps {
  categoria: Categoria | null
  error: string | null
  onSubmit: (datos: CategoriaCreate) => Promise<void>
  onCancel: () => void
}

export const CategoriaForm = ({ categoria, error, onSubmit, onCancel }: CategoriaFormProps) => {
  const form = useForm({
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      descripcion: categoria?.descripcion ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null })
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
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const limpio = value.trim()
            if (limpio.length < 2) return 'El nombre debe tener al menos 2 caracteres'
            if (limpio.length > 100) return 'El nombre puede tener hasta 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Nombre"
            placeholder="Ej: Pizzas"
            autoFocus
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field
        name="descripcion"
        validators={{
          onChange: ({ value }) => (value.trim().length > 500 ? 'La descripción puede tener hasta 500 caracteres' : undefined),
        }}
      >
        {(field) => (
          <Textarea
            id={field.name}
            label="Descripción (opcional)"
            rows={3}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
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
              {enviando ? 'Guardando...' : categoria ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

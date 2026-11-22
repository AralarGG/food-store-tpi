import { useForm } from '@tanstack/react-form'
import { Button } from '../../../shared/ui/Button'
import { Input, primerError, Select, Textarea } from '../../../shared/ui/Input'
import { Mensaje } from '../../../shared/ui/Mensaje'
import type { Categoria } from '../../categorias/types/categoria'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  producto: Producto | null
  categorias: Categoria[]
  error: string | null
  onSubmit: (datos: ProductoCreate) => Promise<void>
  onCancel: () => void
}

const PATRON_URL = /^https?:\/\/\S+$/

// Los números se editan como texto para permitir el campo vacío mientras se escribe
const validarNumero = (valor: string, entero: boolean): string | undefined => {
  if (valor.trim() === '') return 'Completá este campo'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'Ingresá un número válido'
  if (numero < 0) return 'No puede ser negativo'
  if (entero && !Number.isInteger(numero)) return 'Ingresá un número entero'
  return undefined
}

export const ProductoForm = ({ producto, categorias, error, onSubmit, onCancel }: ProductoFormProps) => {
  // Si el producto pertenece a una categoría dada de baja, se la muestra para no perderla al editar
  const opciones =
    producto && !categorias.some((c) => c.id === producto.categoria_id) ? [...categorias, producto.categoria] : categorias

  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      precio_base: producto ? String(producto.precio_base) : '',
      imagen_url: producto?.imagen_url ?? '',
      stock: String(producto?.stock ?? 0),
      disponible: producto?.disponible ?? true,
      categoria_id: producto ? String(producto.categoria_id) : '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      })
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
            if (value.trim() === '') return 'Ingresá el nombre del producto'
            if (value.trim().length > 150) return 'El nombre puede tener hasta 150 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Nombre"
            autoFocus
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value === '' ? 'Elegí una categoría' : undefined) }}
      >
        {(field) => (
          <Select
            id={field.name}
            label="Categoría"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          >
            <option value="">Elegí una categoría</option>
            {opciones.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
                {categoria.activo ? '' : ' (dada de baja)'}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field
        name="descripcion"
        validators={{
          onChange: ({ value }) => (value.trim().length > 1000 ? 'La descripción puede tener hasta 1000 caracteres' : undefined),
        }}
      >
        {(field) => (
          <Textarea
            id={field.name}
            label="Descripción (opcional)"
            rows={2}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="precio_base" validators={{ onChange: ({ value }) => validarNumero(value, false) }}>
          {(field) => (
            <Input
              id={field.name}
              label="Precio"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={primerError(field.state.meta)}
            />
          )}
        </form.Field>

        <form.Field name="stock" validators={{ onChange: ({ value }) => validarNumero(value, true) }}>
          {(field) => (
            <Input
              id={field.name}
              label="Stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={primerError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="imagen_url"
        validators={{
          onChange: ({ value }) => {
            const limpio = value.trim()
            if (limpio === '') return undefined
            if (limpio.length > 500) return 'La URL puede tener hasta 500 caracteres'
            return PATRON_URL.test(limpio) ? undefined : 'Ingresá una URL que empiece con http:// o https://'
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="URL de la imagen (opcional)"
            type="url"
            placeholder="https://"
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
              {enviando ? 'Guardando...' : producto ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

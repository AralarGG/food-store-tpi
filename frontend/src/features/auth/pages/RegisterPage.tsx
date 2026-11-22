import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input, primerError } from '../../../shared/ui/Input'
import { Mensaje } from '../../../shared/ui/Mensaje'
import { useAuthStore } from '../../../store/authStore'
import { useRegistro } from '../hooks/useRegistro'

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RegisterPage = () => {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const login = useAuthStore((s) => s.login)
  const registro = useRegistro()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const desde = (location.state as { desde?: string } | null)?.desde ?? '/'

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmacion: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const datos = {
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        }
        await registro.mutateAsync(datos)
        // Con la cuenta creada se inicia la sesión directamente
        await login(datos.username, datos.password)
        queryClient.clear()
        navigate(desde, { replace: true })
      } catch (e) {
        setError(handleApiError(e))
      }
    },
  })

  if (usuario && !cargando) {
    return <Navigate to={desde} replace />
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <p className="mt-1 text-sm text-stone-500">Con una cuenta podés confirmar pedidos y seguir su estado.</p>

      <Card className="mt-6 p-6">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                const limpio = value.trim()
                if (limpio.length < 3) return 'El usuario debe tener al menos 3 caracteres'
                if (limpio.length > 50) return 'El usuario puede tener hasta 50 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Usuario"
                autoComplete="username"
                autoFocus
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="full_name"
            validators={{
              onChange: ({ value }) => {
                const limpio = value.trim()
                if (limpio === '') return 'Ingresá tu nombre y apellido'
                if (limpio.length > 100) return 'El nombre puede tener hasta 100 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Nombre y apellido"
                autoComplete="name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => (PATRON_EMAIL.test(value.trim()) ? undefined : 'Ingresá un email válido'),
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
                if (value.length > 72) return 'La contraseña puede tener hasta 72 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                ayuda="Mínimo 8 caracteres."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="confirmacion"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password') ? 'Las contraseñas no coinciden' : undefined,
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
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
              <Button type="submit" disabled={enviando} className="mt-2">
                {enviando ? 'Creando la cuenta...' : 'Crear cuenta'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-stone-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-emerald-800 hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  )
}

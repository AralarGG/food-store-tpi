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

export const LoginPage = () => {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const login = useAuthStore((s) => s.login)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  // Si se llegó desde una ruta protegida, después del login se vuelve a ella
  const desde = (location.state as { desde?: string } | null)?.desde ?? '/'

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.username.trim(), value.password)
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
      <h1 className="text-2xl font-semibold tracking-tight">Ingresar</h1>
      <p className="mt-1 text-sm text-stone-500">Ingresá con tu usuario para confirmar pedidos y ver tu historial.</p>

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
            validators={{ onChange: ({ value }) => (value.trim() === '' ? 'Ingresá tu nombre de usuario' : undefined) }}
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
            name="password"
            validators={{ onChange: ({ value }) => (value === '' ? 'Ingresá tu contraseña' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Contraseña"
                type="password"
                autoComplete="current-password"
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
                {enviando ? 'Ingresando...' : 'Ingresar'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-stone-600">
        ¿No tenés cuenta?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-emerald-800 hover:underline">
          Crear una cuenta
        </Link>
      </p>
    </div>
  )
}

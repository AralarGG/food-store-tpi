import { useMutation } from '@tanstack/react-query'
import { registrar } from '../api/auth'
import type { UserCreate } from '../types/auth'

export const useRegistro = () =>
  useMutation({
    mutationFn: (datos: UserCreate) => registrar(datos),
  })

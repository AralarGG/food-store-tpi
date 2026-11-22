import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

// Instancia única de TanStack Query para toda la aplicación
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Un error 4xx no se arregla reintentando: solo se reintenta una vez ante fallas de red o del servidor
      retry: (intentos, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status !== undefined && status < 500) {
          return false
        }
        return intentos < 1
      },
    },
  },
})

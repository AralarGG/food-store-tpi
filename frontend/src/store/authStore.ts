import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../features/auth/api/auth'
import type { Usuario } from '../features/usuarios/types/usuario'

interface AuthState {
  usuario: Usuario | null
  // true mientras checkSession confirma la sesión con el backend
  cargando: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiarSesion: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        // El token queda en la cookie HttpOnly; después se pide el perfil para guardar el usuario
        await authApi.login(username, password)
        const usuario = await authApi.obtenerPerfil()
        set({ usuario, cargando: false })
      },

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          set({ usuario: null })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          const usuario = await authApi.obtenerPerfil()
          set({ usuario })
        } catch {
          set({ usuario: null })
        } finally {
          set({ cargando: false })
        }
      },

      limpiarSesion: () => set({ usuario: null }),
    }),
    {
      name: 'foodstore-auth',
      // Solo se persiste el usuario: el token nunca pasa por JavaScript
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

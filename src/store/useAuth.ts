import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  authApi,
  type AuthFamily,
  type AuthUser,
} from '../lib/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  family: AuthFamily | null
  loading: boolean
  error: string | null
  guestMode: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    familyName: string,
    name: string,
    email: string,
    password: string,
  ) => Promise<void>
  logout: () => Promise<void>
  tryRefresh: () => Promise<boolean>
  continueAsGuest: () => void
  clear: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      family: null,
      loading: false,
      error: null,
      guestMode: false,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { user, family, tokens } = await authApi.login(email, password)
          set({
            user,
            family,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            loading: false,
            guestMode: false,
          })
        } catch (e) {
          set({ loading: false, error: (e as Error).message })
          throw e
        }
      },

      register: async (familyName, name, email, password) => {
        set({ loading: true, error: null })
        try {
          const { user, family, tokens } = await authApi.register(
            familyName,
            name,
            email,
            password,
          )
          set({
            user,
            family,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            loading: false,
            guestMode: false,
          })
        } catch (e) {
          set({ loading: false, error: (e as Error).message })
          throw e
        }
      },

      logout: async () => {
        const rt = get().refreshToken
        if (rt) await authApi.logout(rt)
        get().clear()
        // Remain in the app as a guest after signing out.
        set({ guestMode: true })
      },

      tryRefresh: async () => {
        const rt = get().refreshToken
        if (!rt) return false
        try {
          const { tokens } = await authApi.refresh(rt)
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          })
          return true
        } catch {
          get().clear()
          return false
        }
      },

      continueAsGuest: () => set({ guestMode: true }),

      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          family: null,
          error: null,
        }),
    }),
    {
      name: 'family-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        family: s.family,
        guestMode: s.guestMode,
      }),
    },
  ),
)

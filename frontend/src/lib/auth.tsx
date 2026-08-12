import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '@/lib/api'
import { translateCurrent } from '@/lib/i18n'
import type { AuthUser } from '@/types/preparation'

const USER_KEY = 'prepai.user'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  updateProfile: (email: string, password?: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  if (!api.getToken()) {
    return null
  }
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const logout = useCallback(() => {
    api.clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const persist = useCallback((token: string, nextUser: AuthUser) => {
    api.setToken(token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password)
      persist(res.token, res.user)
    },
    [persist],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await api.register(email, password)
      persist(res.token, res.user)
    },
    [persist],
  )

  const updateProfile = useCallback(async (email: string, password?: string) => {
    const nextUser = await api.updateMe({ email, password })
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }, [])

  const value = useMemo(
    () => ({ user, login, register, updateProfile, logout }),
    [user, login, register, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error(translateCurrent('auth.contextError'))
  }
  return ctx
}

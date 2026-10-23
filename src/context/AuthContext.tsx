import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { authService, clearApiCache } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hris_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hris_token'))
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('hris_token') && !localStorage.getItem('hris_user'))
  })
  const skipNextRefresh = useRef<boolean>(false)

  const refreshUser = async () => {
    try {
      const res = await authService.getMe()
      if (res.data?.success) {
        setUser(res.data.data)
        localStorage.setItem('hris_user', JSON.stringify(res.data.data))
      }
    } catch {
      setUser(null)
      setToken(null)
      localStorage.removeItem('hris_token')
      localStorage.removeItem('hris_user')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      if (skipNextRefresh.current) {
        skipNextRefresh.current = false
        setIsLoading(false)
      } else {
        refreshUser()
      }
    } else {
      setIsLoading(false)
    }

    const handleUnauthorized = () => {
      clearApiCache()
      setUser(null)
      setToken(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [token])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      clearApiCache()
      const res = await authService.login({ email, password })
      if (res.data?.success) {
        const { token: newToken, user: userData } = res.data.data
        skipNextRefresh.current = true
        localStorage.setItem('hris_token', newToken)
        localStorage.setItem('hris_user', JSON.stringify(userData))
        setUser(userData)
        setToken(newToken)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) await authService.logout()
    } catch {
      // ignore
    } finally {
      clearApiCache()
      setUser(null)
      setToken(null)
      localStorage.removeItem('hris_token')
      localStorage.removeItem('hris_user')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

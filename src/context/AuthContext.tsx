import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/api'
import type { Role, User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  demoLogin: (role: Role) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const DEMO_ACCOUNTS: Record<Role, { email: string; label: string; desc: string }> = {
  Superadmin: {
    email: 'superadmin@hris.local',
    label: 'Super Admin',
    desc: 'Akses Penuh Konfigurasi & Master Data',
  },
  'HR Manager': {
    email: 'hrmanager@hris.local',
    label: 'HR Manager',
    desc: 'Otorisasi Payroll & Final Approval Cuti',
  },
  'HR Staff': {
    email: 'hrstaff@hris.local',
    label: 'HR Staff',
    desc: 'Kelola Karyawan & Generate Draf Gaji',
  },
  Manager: {
    email: 'manager@hris.local',
    label: 'Line Manager (Budi P.)',
    desc: 'Approval Tahap 1 Cuti & Lembur Tim',
  },
  Employee: {
    email: 'employee@hris.local',
    label: 'Karyawan (Siti N.)',
    desc: 'Presensi GPS, Ajukan Cuti & Slip Gaji',
  },
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hris_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hris_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
      refreshUser()
    } else {
      setIsLoading(false)
    }

    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [token])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password })
      if (res.data?.success) {
        const { token: newToken, user: userData } = res.data.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('hris_token', newToken)
        localStorage.setItem('hris_user', JSON.stringify(userData))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const demoLogin = async (role: Role) => {
    const cred = DEMO_ACCOUNTS[role]
    if (cred) {
      await login(cred.email, 'password')
    }
  }

  const logout = async () => {
    try {
      if (token) await authService.logout()
    } catch {
      // ignore
    } finally {
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
        demoLogin,
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

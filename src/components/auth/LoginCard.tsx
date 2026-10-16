import React, { useState } from 'react'
import {
  Briefcase01Icon,
  Building01Icon,
  CheckmarkCircle01Icon,
  LockPasswordIcon,
  Mail01Icon,
  Shield01Icon,
  UserCheck01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { DEMO_ACCOUNTS, useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

export const LoginCard: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'demo' | 'manual'>('demo')

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Silakan periksa kredensial Anda.')
    }
  }

  const handleQuickLogin = async (role: Role) => {
    setError(null)
    try {
      await demoLogin(role)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login demo.')
    }
  }

  const roleIcons: Record<Role, React.ReactNode> = {
    Superadmin: <Icon icon={Shield01Icon} size={20} className="text-purple-600" />,
    'HR Manager': <Icon icon={Building01Icon} size={20} className="text-indigo-600" />,
    'HR Staff': <Icon icon={Briefcase01Icon} size={20} className="text-blue-600" />,
    Manager: <Icon icon={UserGroupIcon} size={20} className="text-emerald-600" />,
    Employee: <Icon icon={UserCheck01Icon} size={20} className="text-teal-600" />,
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur shadow-2xl rounded-3xl border border-slate-100 overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <Icon icon={Building01Icon} size={30} className="text-indigo-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HRIS Enterprise Portal</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-sm">
            Automated Attendance, Multi-Level Approval & End-to-End Payroll System
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ 1-Click Demo Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔑 Login Manual
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'demo' ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Pilih peran akun demo untuk langsung masuk:
            </p>
            <div className="space-y-2.5">
              {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => {
                const item = DEMO_ACCOUNTS[role]
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(role)}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors border border-slate-100">
                        {roleIcons[role]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-900">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.desc}</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      Masuk →
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon icon={Mail01Icon} size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@hris.local"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon icon={LockPasswordIcon} size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center space-x-1.5">
          <Icon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-500" />
          <span>Terhubung ke Laravel API Backend (Port 8000)</span>
        </div>
      </div>
    </div>
  )
}

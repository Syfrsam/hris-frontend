import React, { useState } from 'react'
import { Building01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'
import heroLoginImg from '../../assets/hero-login.webp'

export const LoginCard: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.')
    }
  }

  const handleQuickLogin = async (role: Role) => {
    setError(null)
    try {
      await demoLogin(role)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal masuk akun demo.')
    }
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col md:flex-row bg-card font-sans overflow-hidden">
      {/* Kolom Kiri: Hero Visual (Banner ringkas di mobile, full panel di desktop) */}
      <div className="w-full md:w-1/2 h-20 sm:h-24 md:h-full relative bg-[#1358D0] overflow-hidden flex md:flex-col justify-between p-4 sm:p-6 md:p-12 lg:p-16 shrink-0">
        {/* Mockup Preview dari hero-login.webp */}
        <img
          src={heroLoginImg}
          alt="HRIS Preview"
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
        />

        {/* Tampilan Mobile Header */}
        <div className="flex md:hidden items-center justify-between w-full relative z-10 select-none">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs shrink-0">
              <Icon icon={Building01Icon} size={15} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-tight">
                Designed for <span className="text-[#FFF250]">Individuals</span>
              </h2>
              <p className="text-white/80 text-[10px] font-normal line-clamp-1">
                Presensi GPS, cuti & payroll terpadu
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <span className="w-3.5 h-1.5 rounded-full bg-[#FFF250]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        {/* Tampilan Desktop Header */}
        <div className="hidden md:block relative z-10 max-w-sm select-none">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs mb-5">
            <Icon icon={Building01Icon} size={18} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug">
            Designed for <span className="text-[#FFF250]">Individuals</span>
          </h2>
          <p className="text-white/85 text-xs sm:text-sm font-normal mt-2 leading-relaxed">
            Presensi GPS, manajemen cuti, dan payroll dalam satu sistem terpadu.
          </p>

          {/* Indikator Slider */}
          <div className="flex items-center space-x-1.5 mt-4">
            <span className="w-5 h-1.5 rounded-full bg-[#FFF250]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        {/* Spacer bawah desktop agar mockup aplikasi tetap terlihat */}
        <div className="hidden md:block relative z-10 h-28 sm:h-36 md:h-44 pointer-events-none" />
      </div>

      {/* Kolom Kanan: Form Login Bersih (Pas 100% tanpa scroll di mobile maupun desktop) */}
      <div className="flex-1 w-full md:w-1/2 md:h-full bg-card flex flex-col justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-4 sm:py-6 overflow-hidden">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Masuk Akun
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-normal mt-0.5 mb-3 sm:mb-4">
            Silakan masuk ke sistem HRIS Enterprise.
          </p>

          {error && (
            <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-1.5 font-normal">
              <Icon icon={AlertCircleIcon} size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-2.5 sm:space-y-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-border bg-background text-xs font-normal text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] sm:text-xs font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setError('Hubungi Administrator HR untuk reset password akun Anda.')}
                  className="text-[10px] sm:text-[11px] font-normal text-primary hover:underline transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 sm:h-10 px-3 rounded-lg border border-border bg-background text-xs font-normal text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-[#1358D0]"
                />
                <span className="text-[11px] sm:text-xs text-muted-foreground font-normal">
                  Ingat saya
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 sm:h-10 bg-primary hover:bg-primary/95 text-white font-medium rounded-lg text-xs transition-all shadow-xs disabled:opacity-50 flex items-center justify-center mt-1 cursor-pointer"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="text-center text-[10px] sm:text-[11px] text-muted-foreground font-normal mt-2">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => handleQuickLogin('Employee')}
                className="text-primary hover:underline font-medium"
              >
                Hubungi HR
              </button>
            </div>
          </form>

          {/* Akses Cepat Demo */}
          <div className="mt-3.5 pt-2.5 border-t border-border">
            <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Akses Cepat Demo</span>
              <span className="text-[10px] text-primary font-normal">1-Klik Masuk</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Employee', 'Manager', 'HR Staff', 'HR Manager'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin(role)}
                  className="py-1 px-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-foreground text-[10px] sm:text-xs font-normal border border-border text-center truncate transition-colors cursor-pointer"
                >
                  {role.replace('Manager', 'Mgr')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

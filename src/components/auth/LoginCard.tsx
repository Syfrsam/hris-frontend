import React, { useState } from 'react'
import { Building01Icon, AlertCircleIcon, EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import heroLoginImg from '../../assets/hero-login.webp'

export const LoginCard: React.FC = () => {
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedUser = await login(email, password)
      toast.success(
        'Login Berhasil',
        `Selamat datang kembali, ${loggedUser?.name || 'Pengguna'}!`
      )
    } catch (err: any) {
      const status = err.response?.status
      const msg = err.response?.data?.message

      let userMsg = 'Login gagal. Periksa kembali email dan kata sandi Anda.'
      let title = 'Gagal Masuk'

      if (
        status === 401 ||
        status === 422 ||
        msg?.toLowerCase().includes('sandi') ||
        msg?.toLowerCase().includes('password') ||
        msg?.toLowerCase().includes('email')
      ) {
        title = 'Autentikasi Gagal'
        userMsg = msg || 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.'
      } else if (!err.response) {
        title = 'Koneksi Bermasalah'
        userMsg = 'Gagal terhubung ke server backend HRIS. Pastikan server lokal sedang berjalan.'
      } else if (msg) {
        userMsg = msg
      }

      setError(userMsg)
      toast.error(title, userMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col md:flex-row bg-card font-sans overflow-hidden">
      {/* Kolom Kiri: Hero Visual */}
      <div className="w-full md:w-1/2 h-20 sm:h-24 md:h-full relative bg-[#1358D0] overflow-hidden flex md:flex-col justify-between p-4 sm:p-6 md:p-12 lg:p-16 shrink-0">
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
                HRIS <span className="text-[#FFF250]">Enterprise</span>
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

          <div className="flex items-center space-x-1.5 mt-4">
            <span className="w-5 h-1.5 rounded-full bg-[#FFF250]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        <div className="hidden md:block relative z-10 h-28 sm:h-36 md:h-44 pointer-events-none" />
      </div>

      {/* Kolom Kanan: Form Login */}
      <div className="flex-1 w-full md:w-1/2 md:h-full bg-card flex flex-col justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-4 sm:py-6 overflow-hidden">
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Masuk Akun
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-normal mt-0.5 mb-4">
            Silakan masuk menggunakan kredensial akun HRIS Enterprise Anda.
          </p>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2 font-normal">
              <Icon icon={AlertCircleIcon} size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-foreground mb-1">
                Email Perusahaan
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-normal text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] sm:text-xs font-medium text-foreground">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setError('Hubungi Superadmin atau Administrator HR untuk mengatur ulang kata sandi akun Anda.')
                  }
                  className="text-[10px] sm:text-[11px] font-normal text-primary hover:underline transition-colors cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-background text-xs font-normal text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <Icon icon={showPassword ? EyeOffIcon : EyeIcon} size={16} />
                </button>
              </div>
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
                  Ingat sesi saya
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-primary hover:bg-primary/95 text-white font-medium rounded-lg text-xs transition-all shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2 mt-1 cursor-pointer"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSubmitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal'}</span>
            </button>

            <div className="text-center text-[10px] sm:text-[11px] text-muted-foreground font-normal pt-2">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() =>
                  setError('Pendaftaran akun dikelola secara terpusat oleh Superadmin dan Divisi HR.')
                }
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Hubungi Administrator
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import {
  Alert02Icon,
  Building01Icon,
  Calendar03Icon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  EyeIcon,
  EyeOffIcon,
  LockPasswordIcon,
  Location01Icon,
  SecurityCheckIcon,
  Settings01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services/api'
import type { Role } from '../../types'
import { Avatar } from '../common/Avatar'
import { AvatarCropModal } from '../common/AvatarCropModal'
import { Icon } from '../common/Icon'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

type SettingsTab = 'profile' | 'security' | 'employment'

const ROLE_BADGE_STYLES: Record<Role, string> = {
  Superadmin: 'bg-brand-dark text-white border-brand-dark dark:border-secondary/40 dark:text-secondary',
  'HR Manager': 'bg-primary/10 text-primary border-primary/30',
  'HR Staff': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  Manager: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
  Employee: 'bg-muted text-foreground border-border',
}

export const AccountSettings: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Profile Form State
  const [name, setName] = useState<string>(user?.name || '')
  const [email, setEmail] = useState<string>(user?.email || '')
  const [phone, setPhone] = useState<string>(user?.phone || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null)
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false)

  // Avatar Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null)

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false)

  // Inline Feedback Banner State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Real-time Password Security Criteria Validation
  const passwordValidation = useMemo(() => {
    const hasMinLength = newPassword.length >= 6
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const isMatched = Boolean(confirmPassword.length > 0 && newPassword === confirmPassword)

    const passedCount = Number(hasMinLength) + Number(hasUppercase) + Number(hasNumber)
    const isValid = hasMinLength && hasUppercase && hasNumber

    let strengthLabel = 'Belum diisi'
    let strengthColor = 'bg-muted'
    let strengthTextColor = 'text-muted-foreground'

    if (newPassword.length > 0) {
      if (passedCount <= 1) {
        strengthLabel = 'Lemah'
        strengthColor = 'bg-rose-500'
        strengthTextColor = 'text-rose-600 dark:text-rose-400'
      } else if (passedCount === 2) {
        strengthLabel = 'Sedang'
        strengthColor = 'bg-amber-500'
        strengthTextColor = 'text-amber-600 dark:text-amber-400'
      } else if (passedCount === 3) {
        strengthLabel = 'Kuat'
        strengthColor = 'bg-emerald-500'
        strengthTextColor = 'text-emerald-600 dark:text-emerald-400'
      }
    }

    return {
      hasMinLength,
      hasUppercase,
      hasNumber,
      isMatched,
      passedCount,
      isValid,
      strengthLabel,
      strengthColor,
      strengthTextColor,
    }
  }, [newPassword, confirmPassword])

  const primaryRole: Role = (user?.roles?.[0] as Role) || 'Employee'

  // Handle avatar file selection from disk
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Format Tidak Didukung', 'Harap pilih file gambar (JPG, PNG, atau WebP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Terlalu Besar', 'Ukuran foto maksimal 10 MB sebelum penyesuaian.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropSourceImage(reader.result as string)
      setIsCropModalOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle crop completion
  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setAvatarFile(croppedFile)
    setAvatarPreview(previewUrl)
    const sizeKb = Math.round(croppedFile.size / 1024)
    toast.success('Foto Disesuaikan', `Foto berhasil dipotong dan siap disimpan (${sizeKb} KB, maks 1 MB).`)
  }

  // Submit Profile Form
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setFeedback(null)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      if (phone.trim()) {
        formData.append('phone', phone.trim())
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const res = await authService.updateProfile(formData)
      if (res.data?.success) {
        await refreshUser()
        const successMsg = 'Profil akun Anda berhasil diperbarui.'
        setFeedback({ type: 'success', text: successMsg })
        toast.success('Profil Diperbarui', successMsg)
        setAvatarFile(null)
      }
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors
      const firstValidationMsg = validationErrors
        ? (Object.values(validationErrors).flat()[0] as string)
        : null
      const errorMsg =
        firstValidationMsg || err.response?.data?.message || 'Gagal menyimpan pembaruan profil.'
      setFeedback({ type: 'error', text: errorMsg })
      toast.error('Gagal Memperbarui Profil', errorMsg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Submit Password Change Form
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!currentPassword) {
      const msg = 'Kata sandi saat ini wajib diisi.'
      setFeedback({ type: 'error', text: msg })
      toast.error('Validasi Gagal', msg)
      return
    }

    if (!passwordValidation.hasMinLength) {
      const msg = 'Kata sandi baru minimal 6 karakter.'
      setFeedback({ type: 'error', text: msg })
      toast.error('Validasi Gagal', msg)
      return
    }

    if (!passwordValidation.hasUppercase) {
      const msg = 'Kata sandi baru harus mengandung minimal 1 huruf besar (A-Z).'
      setFeedback({ type: 'error', text: msg })
      toast.error('Validasi Gagal', msg)
      return
    }

    if (!passwordValidation.hasNumber) {
      const msg = 'Kata sandi baru harus mengandung minimal 1 angka (0-9).'
      setFeedback({ type: 'error', text: msg })
      toast.error('Validasi Gagal', msg)
      return
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Konfirmasi kata sandi baru tidak sesuai.'
      setFeedback({ type: 'error', text: msg })
      toast.error('Validasi Gagal', msg)
      return
    }

    setIsSavingPassword(true)

    try {
      const res = await authService.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })

      if (res.data?.success) {
        const successMsg = 'Kata sandi akun Anda berhasil diperbarui.'
        setFeedback({ type: 'success', text: successMsg })
        toast.success('Kata Sandi Diperbarui', successMsg)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors
      const firstValidationMsg = validationErrors
        ? (Object.values(validationErrors).flat()[0] as string)
        : null
      const errorMsg =
        firstValidationMsg || err.response?.data?.message || 'Gagal mengubah kata sandi akun.'
      setFeedback({ type: 'error', text: errorMsg })
      toast.error('Gagal Mengubah Sandi', errorMsg)
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-5 font-sans max-w-5xl mx-auto">
      {/* Header Banner */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-xs overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Icon icon={Settings01Icon} size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Pengaturan Akun
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    ROLE_BADGE_STYLES[primaryRole] || ROLE_BADGE_STYLES.Employee
                  }`}
                >
                  {primaryRole}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kelola informasi profil pribadi, alamat email, kata sandi, dan foto avatar akun Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Akun Aktif</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            <Icon
              icon={feedback.type === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
              size={17}
              className={feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-rose-600 dark:text-rose-400 shrink-0'}
            />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-foreground/5 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Icon icon={UserGroupIcon} size={15} />
          <span>Profil Pribadi & Foto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Icon icon={LockPasswordIcon} size={15} />
          <span>Keamanan & Kata Sandi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('employment')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employment'
              ? 'bg-card text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Icon icon={Building01Icon} size={15} />
          <span>Data Organisasi & Peran</span>
        </button>
      </div>

      {/* Tab 1: Profile & Avatar Settings */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Avatar Management Card */}
          <Card className="p-5 bg-card border-border shadow-xs flex flex-col items-center text-center space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Foto Profil Akun</h2>
              <p className="text-[11px] text-muted-foreground">
                Gunakan foto wajah jelas untuk identifikasi presensi dan profil tim.
              </p>
            </div>

            <div className="relative group w-28 h-28 rounded-full border-2 border-primary/20 p-1 bg-background shadow-xs">
              <Avatar
                src={avatarPreview || user?.avatar_url}
                name={name || user?.name}
                size="xl"
                className="w-full h-full rounded-full"
              />
              <label
                htmlFor="settings-avatar-upload"
                className="absolute inset-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-medium z-10"
                title="Ganti foto profil"
              >
                <Icon icon={Camera01Icon} size={18} />
                <span>Ubah</span>
              </label>
            </div>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              id="settings-avatar-upload"
              className="hidden"
              onChange={handleAvatarSelect}
            />

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('settings-avatar-upload')?.click()}
                className="gap-1.5 text-xs font-medium cursor-pointer h-8 w-full rounded-lg"
              >
                <Icon icon={Camera01Icon} size={14} />
                <span>{avatarPreview ? 'Pilih Foto Baru' : 'Unggah Foto'}</span>
              </Button>

              {(avatarPreview || user?.avatar_url) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (cropSourceImage) {
                      setIsCropModalOpen(true)
                    } else if (avatarPreview || user?.avatar_url) {
                      setCropSourceImage(avatarPreview || user?.avatar_url || null)
                      setIsCropModalOpen(true)
                    }
                  }}
                  className="text-xs font-medium cursor-pointer h-7 text-primary hover:text-primary rounded-lg"
                >
                  Atur Posisi & Crop Foto
                </Button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-left w-full text-[11px] space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">Panduan Foto:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li>Format didukung: JPG, PNG, atau WebP.</li>
                <li>Ukuran maksimal 1 MB (otomatis dikompres).</li>
                <li>Gunakan rasio persegi untuk hasil proporsional.</li>
              </ul>
            </div>
          </Card>

          {/* Profile Form Card */}
          <Card className="p-5 lg:col-span-2 bg-card border-border shadow-xs">
            <div className="mb-4 space-y-0.5 border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">Informasi Pribadi & Kontak</h2>
              <p className="text-xs text-muted-foreground">
                Perbarui nama lengkap, alamat email utama, dan nomor kontak aktif Anda.
              </p>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="h-9 text-xs sm:text-sm rounded-lg"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nama ini akan ditampilkan pada seluruh sistem, slip gaji, dan persetujuan.
                </p>
              </div>

              {/* Email & Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Alamat Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="h-9 text-xs sm:text-sm rounded-lg"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Digunakan untuk masuk (login) ke sistem HRIS.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nomor Telepon / WhatsApp
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="h-9 text-xs sm:text-sm rounded-lg"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Nomor kontak aktif untuk notifikasi dan koordinasi darurat.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setName(user?.name || '')
                    setEmail(user?.email || '')
                    setPhone(user?.phone || '')
                    setAvatarFile(null)
                    setAvatarPreview(user?.avatar_url || null)
                    setFeedback(null)
                  }}
                  className="h-8.5 px-3.5 text-xs font-medium cursor-pointer rounded-lg"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingProfile}
                  className="h-8.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg shadow-xs"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={CheckmarkCircle02Icon} size={15} />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Security & Password Settings */}
      {activeTab === 'security' && (
        <Card className="p-5 sm:p-6 bg-card border-border shadow-xs max-w-2xl mx-auto">
          <div className="mb-4 space-y-0.5 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={LockPasswordIcon} size={18} />
              </div>
              <h2 className="text-base font-bold text-foreground">Ubah Kata Sandi</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun Anda di sistem.
            </p>
          </div>

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Kata Sandi Saat Ini <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama Anda"
                  className="h-9 pr-9 text-xs sm:text-sm rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label={showCurrentPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <Icon icon={showCurrentPassword ? EyeOffIcon : EyeIcon} size={15} />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Kata Sandi Baru <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="h-9 pr-9 text-xs sm:text-sm rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <Icon icon={showNewPassword ? EyeOffIcon : EyeIcon} size={15} />
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Konfirmasi Kata Sandi Baru <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="h-9 pr-9 text-xs sm:text-sm rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <Icon icon={showConfirmPassword ? EyeOffIcon : EyeIcon} size={15} />
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1.5">
                  {passwordValidation.isMatched ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <Icon icon={CheckmarkCircle02Icon} size={14} className="shrink-0" />
                      <span>Konfirmasi kata sandi cocok.</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-destructive font-medium flex items-center gap-1.5">
                      <Icon icon={Alert02Icon} size={14} className="shrink-0" />
                      <span>Konfirmasi kata sandi belum cocok.</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Real-time Password Security Criteria Checklist */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">
                  Syarat Keamanan Kata Sandi:
                </span>
                {newPassword.length > 0 && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md bg-background border border-border ${passwordValidation.strengthTextColor}`}>
                    Kekuatan: {passwordValidation.strengthLabel}
                  </span>
                )}
              </div>

              {/* Strength Meter Bar */}
              {newPassword.length > 0 && (
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      passwordValidation.passedCount >= 1 ? passwordValidation.strengthColor : 'bg-muted-foreground/20'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      passwordValidation.passedCount >= 2 ? passwordValidation.strengthColor : 'bg-muted-foreground/20'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      passwordValidation.passedCount >= 3 ? passwordValidation.strengthColor : 'bg-muted-foreground/20'
                    }`}
                  />
                </div>
              )}

              {/* Requirement Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {/* Syarat 1: Minimal 6 Karakter */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    passwordValidation.hasMinLength
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'bg-background/80 border-border text-muted-foreground'
                  }`}
                >
                  {passwordValidation.hasMinLength ? (
                    <Icon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    </span>
                  )}
                  <span className="text-[11px]">Minimal 6 karakter</span>
                </div>

                {/* Syarat 2: Huruf Besar (A-Z) */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    passwordValidation.hasUppercase
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'bg-background/80 border-border text-muted-foreground'
                  }`}
                >
                  {passwordValidation.hasUppercase ? (
                    <Icon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    </span>
                  )}
                  <span className="text-[11px]">Huruf besar (A-Z)</span>
                </div>

                {/* Syarat 3: Angka (0-9) */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    passwordValidation.hasNumber
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'bg-background/80 border-border text-muted-foreground'
                  }`}
                >
                  {passwordValidation.hasNumber ? (
                    <Icon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    </span>
                  )}
                  <span className="text-[11px]">Mengandung angka (0-9)</span>
                </div>

                {/* Syarat 4: Konfirmasi Cocok */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    passwordValidation.isMatched
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'bg-background/80 border-border text-muted-foreground'
                  }`}
                >
                  {passwordValidation.isMatched ? (
                    <Icon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    </span>
                  )}
                  <span className="text-[11px]">Konfirmasi kata sandi cocok</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="submit"
                size="sm"
                disabled={
                  isSavingPassword ||
                  !currentPassword ||
                  !passwordValidation.isValid ||
                  !passwordValidation.isMatched
                }
                className="h-8.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg shadow-xs"
              >
                {isSavingPassword ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={LockPasswordIcon} size={15} />
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Employment Organization Data (Read-Only Transparency) */}
      {activeTab === 'employment' && (
        <div className="space-y-4">
          <Card className="p-5 bg-card border-border shadow-xs">
            <div className="mb-4 space-y-0.5 border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Data Kepegawaian & Penempatan</h2>
                <p className="text-xs text-muted-foreground">
                  Informasi resmi organisasi yang tercatat di database HRIS perusahaan Anda.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                Data Resmi HR
              </Badge>
            </div>

            {user?.employee ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">NIK Karyawan</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {user.employee.employee_code || '-'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Departemen</span>
                  <p className="text-sm font-semibold text-foreground">
                    {user.employee.department?.name || 'Belum Diatur'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Jabatan / Posisi</span>
                  <p className="text-sm font-semibold text-foreground">
                    {user.employee.job_position?.title || 'Staff'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Kantor Cabang</span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Icon icon={Location01Icon} size={14} className="text-primary shrink-0" />
                    <span>{user.employee.branch?.name || 'Kantor Pusat'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Peran Sistem Utama</span>
                  <div className="flex items-center gap-1.5">
                    <Icon icon={SecurityCheckIcon} size={14} className="text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground">{primaryRole}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Radius Presensi GPS</span>
                  <p className="text-sm font-semibold text-foreground">
                    {user.employee.branch?.radius_meters ? `${user.employee.branch.radius_meters} Meter` : '100 Meter'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 bg-muted/20 rounded-xl border border-dashed border-border">
                <Icon icon={Building01Icon} size={28} className="text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Akun Sistem / Non-Karyawan</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Akun Anda terdaftar sebagai administrator sistem langsung tanpa profil karyawan terikat.
                </p>
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Icon icon={Calendar03Icon} size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Perlu Perubahan Data Kepegawaian?</span>
                <p className="text-[11px] mt-0.5">
                  Data divisi, jabatan, atau mutasi cabang dikelola secara terpusat oleh Departemen Human Resources.
                  Silakan hubungi HR jika terdapat pembaruan status kepegawaian.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reusable Avatar Crop & Compression Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropSourceImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        maxOutputDimension={512}
        maxFileSizeBytes={1024 * 1024}
      />
    </div>
  )
}

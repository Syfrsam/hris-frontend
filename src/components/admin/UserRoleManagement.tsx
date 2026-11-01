import React, { useEffect, useMemo, useState } from 'react'
import {
  Add01Icon,
  Alert02Icon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  InformationCircleIcon,
  LockPasswordIcon,
  RefreshIcon,
  Search01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userService } from '../../services/api'
import type { Role } from '../../types'
import { Icon } from '../common/Icon'
import { Avatar } from '../common/Avatar'
import { AvatarCropModal } from '../common/AvatarCropModal'
import { Pagination } from '../common/Pagination'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Input } from '../ui/input'

export interface ManagedUser {
  id: number
  name: string
  email: string
  phone: string | null
  avatar_url?: string | null
  is_active: boolean
  roles: Role[]
  primary_role: Role
  employee: {
    id: number
    employee_code: string
    full_name: string
    department: string | null
    job_position: string | null
    branch: string | null
  } | null
  created_at: string | null
}

const ROLE_OPTIONS: Role[] = ['Superadmin', 'HR Manager', 'HR Staff', 'Manager', 'Employee']

const ROLE_BADGE_STYLES: Record<Role, string> = {
  Superadmin: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900',
  'HR Manager': 'bg-primary/10 text-primary border-primary/25',
  'HR Staff': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  Manager: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
  Employee: 'bg-muted/70 text-foreground border-border/80',
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Superadmin: 'Akses penuh ke seluruh modul sistem, kelola akun pengguna, dan pengaturan peran.',
  'HR Manager': 'Persetujuan akhir cuti & lembur, proses payroll, serta master data karyawan.',
  'HR Staff': 'Kelola data karyawan, rekap presensi, lembur, dan penyusunan draf payroll.',
  Manager: 'Monitoring presensi tim kerja serta persetujuan cuti & lembur tim.',
  Employee: 'Presensi mandiri harian, pengajuan cuti & lembur, dan melihat slip gaji.',
}

// Crisp, pixel-perfect dropdown chevron
const ChevronDown: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
)

export const UserRoleManagement: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Modal state for Create / Edit User
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Employee' as Role,
    password: '',
    is_active: true,
  })

  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await userService.getUsers()
      if (res.data?.success) {
        setUsers(res.data.data.users || [])
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        return
      }
      const msg = err.response?.data?.message || 'Gagal memuat daftar pengguna.'
      setErrorMsg(msg)
      toast.error('Gagal Memuat Data', msg)
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Listen to Escape key to close modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Computed filtered list
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.primary_role !== roleFilter) {
        return false
      }
      // Status filter
      if (statusFilter === 'ACTIVE' && !u.is_active) return false
      if (statusFilter === 'INACTIVE' && u.is_active) return false

      // Search text query
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.employee?.employee_code || '').toLowerCase().includes(q) ||
        (u.employee?.department || '').toLowerCase().includes(q) ||
        (u.employee?.job_position || '').toLowerCase().includes(q) ||
        (u.employee?.branch || '').toLowerCase().includes(q)
      )
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  // Computed summary counts
  const summaryCounts = useMemo(() => {
    const counts = {
      total: users.length,
      active: 0,
      inactive: 0,
      Superadmin: 0,
      'HR Manager': 0,
      'HR Staff': 0,
      Manager: 0,
      Employee: 0,
    }
    for (const u of users) {
      if (u.is_active) counts.active++
      else counts.inactive++
      if (u.primary_role in counts) {
        counts[u.primary_role] = (counts[u.primary_role] || 0) + 1
      }
    }
    return counts
  }, [users])

  const handleQuickRoleChange = async (target: ManagedUser, newRole: Role) => {
    if (target.primary_role === newRole) return
    setUpdatingUserId(target.id)
    setFeedback(null)
    try {
      const res = await userService.updateUser(target.id, { role: newRole })
      if (res.data?.success) {
        const updated: ManagedUser = res.data.data
        setUsers((prev) => prev.map((item) => (item.id === target.id ? updated : item)))
        const successMsg = `Role untuk ${updated.name} berhasil diubah menjadi ${updated.primary_role}.`
        setFeedback({ type: 'success', text: successMsg })
        toast.success('Role Diperbarui', successMsg)
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal memperbarui role pengguna.'
      setFeedback({ type: 'error', text: errMsg })
      toast.error('Perubahan Role Gagal', errMsg)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleToggleActive = async (target: ManagedUser) => {
    setUpdatingUserId(target.id)
    setFeedback(null)
    try {
      const res = await userService.updateUser(target.id, { is_active: !target.is_active })
      if (res.data?.success) {
        const updated: ManagedUser = res.data.data
        setUsers((prev) => prev.map((item) => (item.id === target.id ? updated : item)))
        const successMsg = `Status akun ${updated.name} kini ${updated.is_active ? 'Aktif' : 'Nonaktif'}.`
        setFeedback({ type: 'success', text: successMsg })
        toast.success('Status Akun Berubah', successMsg)
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal mengubah status akun.'
      setFeedback({ type: 'error', text: errMsg })
      toast.error('Gagal Mengubah Status', errMsg)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setShowPassword(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setCropSourceImage(null)
    setIsCropModalOpen(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Employee',
      password: '',
      is_active: true,
    })
    setFeedback(null)
    setIsModalOpen(true)
  }

  const openEditModal = (target: ManagedUser) => {
    setEditingUser(target)
    setShowPassword(false)
    setAvatarFile(null)
    setAvatarPreview(target.avatar_url || null)
    setCropSourceImage(null)
    setIsCropModalOpen(false)
    setFormData({
      name: target.name,
      email: target.email,
      phone: target.phone || '',
      role: target.primary_role,
      password: '',
      is_active: target.is_active,
    })
    setFeedback(null)
    setIsModalOpen(true)
  }

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

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setAvatarFile(croppedFile)
    setAvatarPreview(previewUrl)
    const sizeKb = Math.round(croppedFile.size / 1024)
    toast.success('Foto Disesuaikan', `Foto berhasil dipotong dan dikompres (${sizeKb} KB, maks 1 MB).`)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const formPayload = new FormData()
      formPayload.append('name', formData.name.trim())
      formPayload.append('email', formData.email.trim())
      if (formData.phone.trim()) {
        formPayload.append('phone', formData.phone.trim())
      }
      formPayload.append('role', formData.role)
      formPayload.append('is_active', formData.is_active ? '1' : '0')
      if (formData.password.trim()) {
        formPayload.append('password', formData.password.trim())
      }
      if (avatarFile) {
        formPayload.append('avatar', avatarFile)
      }

      if (editingUser) {
        const res = await userService.updateUser(editingUser.id, formPayload)
        if (res.data?.success) {
          const updated: ManagedUser = res.data.data
          setUsers((prev) => prev.map((item) => (item.id === editingUser.id ? updated : item)))
          if (currentUser?.id === editingUser.id) {
            await refreshUser()
          }
          const successMsg = `Akun ${updated.name} berhasil diperbarui.`
          setFeedback({ type: 'success', text: successMsg })
          toast.success('Akun Diperbarui', successMsg)
          setIsModalOpen(false)
        }
      } else {
        const res = await userService.createUser(formPayload)
        if (res.data?.success) {
          const created: ManagedUser = res.data.data
          setUsers((prev) => [...prev, created])
          const successMsg = `Akun baru ${created.name} (${created.primary_role}) berhasil ditambahkan.`
          setFeedback({ type: 'success', text: successMsg })
          toast.success('Akun Ditambahkan', successMsg)
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors
      const firstValidationMsg = validationErrors
        ? (Object.values(validationErrors).flat()[0] as string)
        : null
      const finalMsg = firstValidationMsg || err.response?.data?.message || 'Gagal menyimpan data akun pengguna.'
      const isValidation = err.response?.status === 422
      toast.error(isValidation ? 'Validasi Gagal' : 'Gagal Menyimpan Akun', finalMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFilterActive = searchQuery !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL'

  const handleResetFilters = () => {
    setSearchQuery('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
  }

  return (
    <div className="space-y-5 sm:space-y-6 font-sans text-xs sm:text-sm">
      {/* Header Banner - Matches Peraturan Denda */}
      <div className="bg-primary text-primary-foreground p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider mb-2">
              <Icon icon={SecurityCheckIcon} size={14} className="mr-1.5" />
              Keamanan & Otorisasi Sistem
            </Badge>
            <h2 className="text-base sm:text-xl font-semibold tracking-tight text-white">
              Kelola Pengguna & Hak Akses Role
            </h2>
            <p className="text-primary-foreground/85 text-xs mt-1 font-normal leading-relaxed">
              Kelola seluruh akun pengguna terdaftar, tetapkan peran wewenang sistem (Superadmin, HR, Manajer, Karyawan), dan kontrol otentikasi login.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchUsers(true)}
              disabled={isLoading}
              className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Segarkan data pengguna"
            >
              <Icon
                icon={RefreshIcon}
                size={14}
                className={isLoading ? 'animate-spin' : ''}
              />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="h-8.5 px-3.5 rounded-xl bg-white text-primary hover:bg-white/95 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Icon icon={Add01Icon} size={14} />
              <span>Tambah Akun Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Filter Option Cards - Matches Peraturan Denda Scheme Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { key: 'ALL', label: 'Semua Akun', count: summaryCounts.total, icon: UserGroupIcon, subtitle: 'Seluruh pengguna' },
          { key: 'Superadmin', label: 'Superadmin', count: summaryCounts.Superadmin, icon: SecurityCheckIcon, subtitle: 'Akses penuh' },
          { key: 'HR Manager', label: 'HR Manager', count: summaryCounts['HR Manager'], subtitle: 'Payroll & Master' },
          { key: 'HR Staff', label: 'HR Staff', count: summaryCounts['HR Staff'], subtitle: 'Administrasi HR' },
          { key: 'Manager', label: 'Manager', count: summaryCounts.Manager, subtitle: 'Monitoring tim' },
          { key: 'Employee', label: 'Employee', count: summaryCounts.Employee, subtitle: 'Presensi mandiri' },
        ].map((card) => {
          const isSelected = roleFilter === card.key
          return (
            <div
              key={card.key}
              onClick={() => setRoleFilter(card.key)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="font-medium text-foreground truncate">
                  {card.label}
                </span>
                {card.icon && (
                  <Icon icon={card.icon} size={13} className="text-primary shrink-0" />
                )}
              </div>
              <p className="text-xl font-medium mt-1 tabular-nums tracking-tight text-foreground">{card.count}</p>
              <div className="mt-1.5 pt-1.5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-normal">
                <span className="truncate">{card.subtitle}</span>
                <span className={isSelected ? 'text-primary font-medium' : 'text-muted-foreground/70'}>
                  {isSelected ? 'Aktif' : 'Pilih'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 sm:p-4 rounded-xl text-xs flex items-start space-x-2.5 border font-normal transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Icon
              icon={feedback.type === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
              size={16}
              className={feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-rose-600 dark:text-rose-400 shrink-0'}
            />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-foreground/5 cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Tutup notifikasi"
          >
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Main Table Card - Matches Peraturan Denda Card Container */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        {/* Card Header with Title, Description, and Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon={UserGroupIcon} size={18} className="text-primary" />
              <span>Daftar Akun Pengguna & Hak Akses</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
              Kelola otorisasi peran, ubah role cepat, dan aktifkan atau nonaktifkan akun pengguna.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Icon
                icon={Search01Icon}
                size={14}
                className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, NIK..."
                aria-label="Cari akun pengguna"
                className="pl-8.5 pr-7 h-8.5 text-xs rounded-xl font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <Icon icon={Cancel01Icon} size={13} />
                </button>
              )}
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <select
                aria-label="Filter berdasarkan role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto h-8.5 pl-3 pr-8 rounded-xl border border-input bg-background text-xs font-normal text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <option value="ALL">Semua Role</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <select
                aria-label="Filter berdasarkan status aktif"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto h-8.5 pl-3 pr-8 rounded-xl border border-input bg-background text-xs font-normal text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-primary hover:text-primary gap-1 h-8 px-2 cursor-pointer rounded-xl font-normal"
              >
                <Icon icon={FilterIcon} size={12} />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center space-y-2.5">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-normal text-muted-foreground">Memuat data pengguna...</p>
          </div>
        ) : errorMsg ? (
          /* Error State */
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Icon icon={Alert02Icon} size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Gagal Menampilkan Data Pengguna</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
            </div>
            <Button variant="default" size="sm" onClick={() => fetchUsers()} className="h-7.5 text-xs cursor-pointer rounded-lg font-normal">
              Coba Muat Ulang
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Icon icon={Search01Icon} size={18} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Tidak Ada Akun yang Sesuai</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isFilterActive
                  ? 'Tidak ada akun yang cocok dengan kata kunci atau filter yang Anda terapkan.'
                  : 'Belum ada akun pengguna yang terdaftar di sistem.'}
              </p>
            </div>
            {isFilterActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-7.5 text-xs cursor-pointer rounded-lg font-normal">
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          /* Data Table */
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[23%]" />
                  <col className="w-[17%]" />
                  <col className="w-[11%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/30 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Pengguna</th>
                    <th className="py-2.5 px-3">Data Karyawan</th>
                    <th className="py-2.5 px-2.5 whitespace-nowrap">Peran & Hak Akses</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Status Akun</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedUsers.map((item) => {
                    const isSelf = currentUser?.id === item.id
                    const isBusy = updatingUserId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-muted/25 transition-colors">
                        {/* User Info */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={item.avatar_url} name={item.name} size="sm" className="shrink-0" />
                            <div className="min-w-0 overflow-hidden">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-normal text-foreground text-xs truncate block" title={item.name}>
                                  {item.name}
                                </span>
                                {isSelf && (
                                  <Badge variant="primarySubtle" className="text-[9px] font-normal px-1.5 py-0.2 shrink-0">
                                    Akun Anda
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate" title={item.email}>
                                {item.email}
                              </p>
                              {item.phone && (
                                <p className="text-[10px] text-muted-foreground/80 truncate">{item.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Linked Employee Info */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          {item.employee ? (
                            <div className="space-y-0.5 min-w-0 overflow-hidden">
                              <p className="text-xs font-normal text-foreground truncate block" title={item.employee.job_position || ''}>
                                {item.employee.job_position || 'Jabatan Belum Diatur'}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate block" title={`${item.employee.department || 'Tanpa Departemen'} · ${item.employee.branch || 'Kantor Pusat'}`}>
                                {item.employee.department || 'Tanpa Departemen'} · {item.employee.branch || 'Kantor Pusat'}
                              </p>
                              {item.employee.employee_code && item.employee.employee_code.trim() !== '' && (
                                <span className="inline-block px-1.5 py-0.2 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border">
                                  NIK: {item.employee.employee_code}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5 min-w-0">
                              <span className="inline-block px-1.5 py-0.2 rounded bg-muted text-[10px] font-normal text-muted-foreground border border-border">
                                Akun Sistem
                              </span>
                              <p className="text-[10px] text-muted-foreground/70">Non-karyawan</p>
                            </div>
                          )}
                        </td>

                        {/* Role Selector */}
                        <td className="py-2.5 px-2.5 align-middle whitespace-nowrap overflow-hidden">
                          <div className="relative inline-flex items-center w-full max-w-[130px]">
                            <select
                              aria-label={`Ubah role untuk ${item.name}`}
                              value={item.primary_role}
                              disabled={isSelf || isBusy}
                              onChange={(e) => handleQuickRoleChange(item, e.target.value as Role)}
                              className={`h-7 pl-2 pr-6 text-xs font-normal rounded-lg border appearance-none transition-all focus:outline-none focus:ring-1 focus:ring-primary w-full truncate ${
                                ROLE_BADGE_STYLES[item.primary_role] || ROLE_BADGE_STYLES.Employee
                              } ${isSelf || isBusy ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                              title={
                                isSelf
                                  ? 'Role akun sendiri tidak dapat diubah'
                                  : 'Klik untuk mengubah role'
                              }
                            >
                              {ROLE_OPTIONS.map((roleOpt) => (
                                <option
                                  key={roleOpt}
                                  value={roleOpt}
                                  className="bg-card text-foreground font-normal text-xs"
                                >
                                  {roleOpt}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2 pointer-events-none opacity-70">
                              <ChevronDown className="w-3 h-3" />
                            </div>
                          </div>
                        </td>

                        {/* Active Status Indicator */}
                        <td className="py-2.5 px-2 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-normal">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                              }`}
                            />
                            <span className={item.is_active ? 'text-foreground' : 'text-muted-foreground'}>
                              {item.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="h-7 px-2 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Icon icon={Edit02Icon} size={13} />
                              <span>Kelola</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSelf || isBusy}
                              onClick={() => handleToggleActive(item)}
                              title={isSelf ? 'Akun Anda tidak dapat dinonaktifkan' : undefined}
                              className={`h-7 px-2 rounded-lg text-xs font-normal border transition-colors shrink-0 ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed border-border/40 text-muted-foreground'
                                  : item.is_active
                                  ? 'border-border/60 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 hover:border-rose-200 cursor-pointer'
                                  : 'border-border/60 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-200 cursor-pointer'
                              }`}
                            >
                              <span>{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="sm:hidden divide-y divide-border rounded-xl border border-border/80 overflow-hidden">
              {paginatedUsers.map((item) => {
                const isSelf = currentUser?.id === item.id
                const isBusy = updatingUserId === item.id

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      !item.is_active ? 'opacity-65 bg-muted/15' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={item.avatar_url} name={item.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-normal text-xs text-foreground truncate">{item.name}</span>
                            {isSelf && (
                              <Badge variant="primarySubtle" className="text-[9px] font-normal px-1.5 py-0.2 shrink-0">
                                Akun Anda
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{item.email}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-normal shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className={item.is_active ? 'text-foreground' : 'text-muted-foreground'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Jabatan & Tim</span>
                        <span className="font-normal text-foreground truncate block">
                          {item.employee?.job_position || (item.employee ? 'Karyawan' : 'Akun Sistem')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Peran (Role)</span>
                        <span className="font-normal text-foreground truncate block">
                          {item.primary_role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="h-7.5 px-3 text-xs font-normal gap-1 cursor-pointer rounded-lg border border-border hover:bg-muted flex-1 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Icon icon={Edit02Icon} size={13} />
                        <span>Kelola</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSelf || isBusy}
                        onClick={() => handleToggleActive(item)}
                        className={`h-7.5 px-3 text-xs font-normal rounded-lg border transition-colors flex-1 flex items-center justify-center ${
                          isSelf
                            ? 'opacity-40 cursor-not-allowed border-border/40 text-muted-foreground'
                            : item.is_active
                            ? 'border-border text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer'
                            : 'border-border text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer'
                        }`}
                      >
                        <span>{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </>
      )}
      </Card>

      {/* Role Guide Matrix - Matches Peraturan Denda Policy Reference */}
      <Card className="p-5 rounded-2xl border border-border bg-muted/30 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-primary">
          <Icon icon={InformationCircleIcon} size={18} />
          <CardTitle className="text-sm font-semibold text-foreground">
            Panduan Hak Akses & Matriks Kewenangan Peran
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground font-normal">
          Ringkasan wewenang dan cakupan akses setiap role di sistem HRIS Enterprise.
        </CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {ROLE_OPTIONS.map((role) => (
            <div key={role} className="p-3 rounded-xl bg-card border border-border space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_BADGE_STYLES[role]}`}>
                {role}
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Create / Edit User Modal Dialog - Balanced, compact, fits 100% desktop perfectly without overflowing top/bottom */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="relative bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md my-auto max-h-[86vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed Top */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="dark" className="text-[9px] px-1.5 py-0.2">
                    Superadmin
                  </Badge>
                  <h3 id="user-modal-title" className="text-sm font-bold text-foreground">
                    {editingUser ? 'Kelola Akun Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {editingUser
                    ? `Perbarui profil, role, atau kata sandi untuk ${editingUser.name}.`
                    : 'Daftarkan pengguna baru dan tentukan hak akses peran.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                aria-label="Tutup jendela modal"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Form Body - Scrollable if screen is very short, but compact enough to fit without scrolling on standard screens */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 text-xs">
              {/* Compact Avatar Upload Field with Interactive Crop */}
              <div className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl border border-border">
                <Avatar src={avatarPreview} name={formData.name || 'User'} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">Foto Avatar / Profil</p>
                      <p className="text-[10px] text-muted-foreground">Format JPG, PNG, WebP (maks. 1 MB)</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        htmlFor="admin-avatar-upload"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-border hover:bg-muted text-[11px] font-medium text-foreground cursor-pointer transition-colors shadow-2xs"
                      >
                        <Icon icon={Camera01Icon} size={12} />
                        <span>{avatarPreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                      </label>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            if (cropSourceImage) {
                              setIsCropModalOpen(true)
                            } else if (avatarPreview) {
                              setCropSourceImage(avatarPreview)
                              setIsCropModalOpen(true)
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-muted/80 hover:bg-muted text-[10px] font-medium text-foreground border border-border cursor-pointer transition-colors"
                          title="Sesuaikan posisi foto"
                        >
                          Atur Posisi
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    id="admin-avatar-upload"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="h-8.5 text-xs rounded-lg"
                />
              </div>

              {/* Email & Telepon in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Alamat Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="nama@perusahaan.com"
                    className="h-8.5 text-xs rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Nomor Telepon
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812xxxxxxxx"
                    className="h-8.5 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Role Selection with Custom Chevron */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Role Akses <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    disabled={Boolean(editingUser && currentUser?.id === editingUser.id)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as Role }))}
                    className="w-full h-8.5 pl-3 pr-8 rounded-lg border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 cursor-pointer appearance-none"
                  >
                    {ROLE_OPTIONS.map((roleOpt) => (
                      <option key={roleOpt} value={roleOpt}>
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug bg-muted/40 px-2 py-1.5 rounded-md border border-border">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={LockPasswordIcon} size={13} className="text-muted-foreground" />
                    <span>{editingUser ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Awal'}</span>
                    {!editingUser && <span className="text-destructive">*</span>}
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={
                      editingUser
                        ? 'Kosongkan jika tidak ingin mengubah sandi'
                        : 'Minimal 6 karakter'
                    }
                    className="h-8.5 pr-8 text-xs rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <Icon icon={showPassword ? EyeOffIcon : EyeIcon} size={14} />
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              {(!editingUser || currentUser?.id !== editingUser.id) && (
                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary accent-primary"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Akun Aktif</p>
                    <p className="text-[10px] text-muted-foreground">
                      Pengguna yang dinonaktifkan tidak dapat masuk ke sistem.
                    </p>
                  </div>
                </label>
              )}

              {/* Modal Footer - Fixed at Bottom */}
              <div className="pt-2.5 border-t border-border flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 text-xs font-medium cursor-pointer rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingUser ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Pengguna'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Crop & Adjustment Modal */}
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

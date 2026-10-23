import React, { useEffect, useMemo, useState } from 'react'
import {
  Add01Icon,
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  LockPasswordIcon,
  RefreshIcon,
  Search01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userService } from '../../services/api'
import type { Role } from '../../types'
import { Icon } from '../common/Icon'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

export interface ManagedUser {
  id: number
  name: string
  email: string
  phone: string | null
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
  Superadmin: 'bg-brand-dark text-white border-brand-dark dark:border-secondary/40 dark:text-secondary',
  'HR Manager': 'bg-primary/10 text-primary border-primary/30',
  'HR Staff': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  Manager: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
  Employee: 'bg-muted text-foreground border-border',
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Superadmin: 'Otoritas tata kelola tertinggi: manajemen pengguna, konfigurasi RBAC, dan akses penuh ke seluruh modul sistem.',
  'HR Manager': 'Otorisasi penggajian final, persetujuan cuti & lembur tahap akhir, serta master data organisasi & karyawan.',
  'HR Staff': 'Operasional direktori karyawan, validasi presensi GPS, audit anomali, dan pembuatan draf payroll periodik.',
  Manager: 'Monitoring kehadiran tim kerja bawahan langsung dan persetujuan pengajuan cuti/lembur tahap pertama.',
  Employee: 'Layanan mandiri (ESS): presensi GPS berbasis radius kantor, pengajuan cuti & lembur, serta unduh slip gaji.',
}

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

  // Modal state for Create / Edit User
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      if (editingUser) {
        const payload: Record<string, any> = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          is_active: formData.is_active,
        }
        if (formData.password.trim()) {
          payload.password = formData.password.trim()
        }
        const res = await userService.updateUser(editingUser.id, payload)
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
        const res = await userService.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
        })
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
      setFeedback({ type: 'error', text: finalMsg })
      toast.error('Validasi Gagal', finalMsg)
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
    <div className="space-y-6 font-sans">
      {/* Superadmin Executive Governance Header */}
      <Card className="p-6 bg-card border-border shadow-xs overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="dark" className="px-2.5 py-0.5 text-xs font-semibold gap-1.5 shadow-xs">
                <Icon icon={SecurityCheckIcon} size={14} className="text-secondary" />
                <span>Otoritas Superadmin</span>
              </Badge>
              <Badge variant="primarySubtle" className="text-xs font-medium">
                Master Governance & RBAC
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Tata Kelola Pengguna & Hak Akses Role
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Pusat kendali akun login, penugasan role hierarki bertingkat (RBAC), otorisasi status aktif, dan pengelolaan kredensial untuk seluruh personel organisasi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="default"
              onClick={() => fetchUsers(true)}
              className="gap-2 cursor-pointer font-medium"
              title="Segarkan data pengguna dari server"
            >
              <Icon
                icon={RefreshIcon}
                size={16}
                className={isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}
              />
              <span>Segarkan</span>
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={openCreateModal}
              className="gap-2 shadow-xs cursor-pointer font-medium"
            >
              <Icon icon={Add01Icon} size={16} />
              <span>Tambah Akun Baru</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Metric Cards & Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Users */}
        <button
          type="button"
          onClick={() => setRoleFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'ALL'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${roleFilter === 'ALL' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              Semua Akun
            </span>
            <Icon icon={UserGroupIcon} size={15} className={roleFilter === 'ALL' ? 'text-primary-foreground/80' : 'text-muted-foreground/60'} />
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts.total}</p>
        </button>

        {/* Superadmin Role */}
        <button
          type="button"
          onClick={() => setRoleFilter('Superadmin')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'Superadmin'
              ? 'bg-brand-dark text-white border-brand-dark shadow-xs ring-1 ring-secondary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${roleFilter === 'Superadmin' ? 'text-secondary' : 'text-muted-foreground'}`}>
              Superadmin
            </span>
            <Icon icon={SecurityCheckIcon} size={15} className={roleFilter === 'Superadmin' ? 'text-secondary' : 'text-muted-foreground/60'} />
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts.Superadmin}</p>
        </button>

        {/* HR Manager Role */}
        <button
          type="button"
          onClick={() => setRoleFilter('HR Manager')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'HR Manager'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold truncate ${roleFilter === 'HR Manager' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              HR Manager
            </span>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts['HR Manager']}</p>
        </button>

        {/* HR Staff Role */}
        <button
          type="button"
          onClick={() => setRoleFilter('HR Staff')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'HR Staff'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold truncate ${roleFilter === 'HR Staff' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              HR Staff
            </span>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts['HR Staff']}</p>
        </button>

        {/* Manager Role */}
        <button
          type="button"
          onClick={() => setRoleFilter('Manager')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'Manager'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold truncate ${roleFilter === 'Manager' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              Manajer Tim
            </span>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts.Manager}</p>
        </button>

        {/* Employee Role */}
        <button
          type="button"
          onClick={() => setRoleFilter('Employee')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            roleFilter === 'Employee'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold truncate ${roleFilter === 'Employee' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              Karyawan (ESS)
            </span>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums tracking-tight">{summaryCounts.Employee}</p>
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            <Icon
              icon={feedback.type === 'success' ? CheckmarkCircle02Icon : Alert02Icon}
              size={18}
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
            <Icon icon={Cancel01Icon} size={15} />
          </button>
        </div>
      )}

      {/* Main Table Card & Filter Toolbar */}
      <Card className="bg-card border-border shadow-xs overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-card">
          <div className="flex flex-1 items-center gap-2.5 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Icon
                icon={Search01Icon}
                size={16}
                className="text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, NIK, jabatan, atau departemen..."
                aria-label="Cari akun pengguna"
                className="pl-9 pr-8 h-10 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <Icon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Role Filter Dropdown */}
            <select
              aria-label="Filter berdasarkan role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer shrink-0"
            >
              <option value="ALL">Semua Role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Filter Dropdown */}
            <select
              aria-label="Filter berdasarkan status aktif"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer shrink-0"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted-foreground">
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-primary hover:text-primary gap-1 h-8 px-2 cursor-pointer"
              >
                <Icon icon={FilterIcon} size={13} />
                <span>Reset Filter</span>
              </Button>
            )}
            <span className="font-medium whitespace-nowrap">
              Menampilkan <strong className="text-foreground tabular-nums">{filteredUsers.length}</strong> dari{' '}
              <strong className="text-foreground tabular-nums">{users.length}</strong> akun
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-16 text-center space-y-3.5">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Memuat daftar akun pengguna & hak akses...</p>
          </div>
        ) : errorMsg ? (
          /* Error State */
          <div className="p-14 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Icon icon={Alert02Icon} size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Gagal Menampilkan Data Pengguna</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
            </div>
            <Button variant="default" size="sm" onClick={() => fetchUsers()} className="cursor-pointer">
              Coba Muat Ulang
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          /* Empty State */
          <div className="p-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Icon icon={Search01Icon} size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Tidak Ada Akun yang Sesuai</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isFilterActive
                  ? 'Tidak ada akun yang cocok dengan kata kunci atau filter yang Anda terapkan.'
                  : 'Belum ada akun pengguna yang terdaftar di dalam sistem.'}
              </p>
            </div>
            {isFilterActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="cursor-pointer">
                Atur Ulang Filter Pencarian
              </Button>
            )}
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4 sm:px-6">Pengguna & Kontak</th>
                  <th className="py-3.5 px-4">Tautan Profil Karyawan</th>
                  <th className="py-3.5 px-4">Role Sistem (RBAC)</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredUsers.map((item) => {
                  const isSelf = currentUser?.id === item.id
                  const isBusy = updatingUserId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              item.primary_role === 'Superadmin'
                                ? 'bg-brand-dark text-white border-brand-dark'
                                : 'bg-muted border-border text-foreground'
                            }`}
                          >
                            {item.name ? item.name.charAt(0).toUpperCase() : <Icon icon={UserIcon} size={15} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground truncate">{item.name}</p>
                              {isSelf && (
                                <Badge variant="primarySubtle" className="text-[10px] font-semibold px-1.5 py-0.2">
                                  Akun Anda
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                            {item.phone && (
                              <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{item.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Linked Employee Info */}
                      <td className="py-4 px-4 align-middle">
                        {item.employee ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">
                              {item.employee.job_position || 'Jabatan Belum Diatur'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.employee.department || 'Tanpa Dept'} · {item.employee.branch || 'Kantor Pusat'}
                            </p>
                            <span className="inline-block px-1.5 py-0.2 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border mt-0.5">
                              NIK: {item.employee.employee_code}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground bg-muted/40">
                              Akun Sistem Utama
                            </Badge>
                            <p className="text-[11px] text-muted-foreground">Tanpa Profil Karyawan ESS</p>
                          </div>
                        )}
                      </td>

                      {/* Role Selector */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Ubah role untuk ${item.name}`}
                            value={item.primary_role}
                            disabled={isSelf || isBusy}
                            onChange={(e) => handleQuickRoleChange(item, e.target.value as Role)}
                            className={`px-2.5 py-1.5 min-h-[36px] rounded-xl border text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                              ROLE_BADGE_STYLES[item.primary_role] || ROLE_BADGE_STYLES.Employee
                            } ${isSelf || isBusy ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                            title={
                              isSelf
                                ? 'Role akun Anda sendiri tidak dapat diubah demi keamanan akses sistem'
                                : 'Klik untuk mengubah role pengguna'
                            }
                          >
                            {ROLE_OPTIONS.map((roleOpt) => (
                              <option
                                key={roleOpt}
                                value={roleOpt}
                                className="bg-card text-foreground font-medium"
                              >
                                {roleOpt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-4 px-4 align-middle">
                        <button
                          type="button"
                          disabled={isSelf || isBusy}
                          onClick={() => handleToggleActive(item)}
                          title={
                            isSelf
                              ? 'Akun Anda sendiri tidak dapat dinonaktifkan demi stabilitas akses'
                              : 'Klik untuk beralih status aktif / nonaktif'
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-full text-xs font-semibold border transition-all ${
                            item.is_active
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                          } ${isSelf || isBusy ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 align-middle text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <Icon icon={Edit02Icon} size={14} className="text-muted-foreground" />
                          <span>Kelola Akun</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Role Scope & Authority Reference Matrix */}
      <Card className="p-5 bg-card border-border shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Matriks Hierarki & Cakupan Wewenang Role (RBAC)
            </h3>
            <p className="text-xs text-muted-foreground/80">
              Referensi pembagian tanggung jawab operasional dan batasan hak akses di HRIS Enterprise.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {ROLE_OPTIONS.map((role) => (
            <div key={role} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ROLE_BADGE_STYLES[role]}`}>
                {role}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Create / Edit User Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-border flex items-center justify-between bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="dark" className="text-[10px] px-1.5 py-0.2">
                    Superadmin
                  </Badge>
                  <h3 id="user-modal-title" className="text-base font-bold text-foreground">
                    {editingUser ? 'Kelola Akun & Hak Akses' : 'Tambah Akun Pengguna Baru'}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {editingUser
                    ? `Perbarui identitas, penetapan role, atau atur ulang kata sandi untuk ${editingUser.name}.`
                    : 'Daftarkan pengguna baru ke dalam sistem dan tentukan hak akses peran.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                aria-label="Tutup jendela modal"
              >
                <Icon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Alamat Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="nama@perusahaan.com"
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nomor Telepon
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812xxxxxxxx"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Role Sistem (RBAC) <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.role}
                  disabled={Boolean(editingUser && currentUser?.id === editingUser.id)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as Role }))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 cursor-pointer"
                >
                  {ROLE_OPTIONS.map((roleOpt) => (
                    <option key={roleOpt} value={roleOpt}>
                      {roleOpt}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon={LockPasswordIcon} size={14} className="text-muted-foreground" />
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
                        ? 'Kosongkan jika tidak ingin merubah sandi'
                        : 'Minimal 6 karakter'
                    }
                    className="h-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <Icon icon={showPassword ? EyeOffIcon : EyeIcon} size={16} />
                  </button>
                </div>
              </div>

              {(!editingUser || currentUser?.id !== editingUser.id) && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Akun Aktif (Dapat Login)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Bila dinonaktifkan, sesi pengguna langsung dicabut dan tidak dapat masuk ke sistem.
                    </p>
                  </div>
                </label>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer text-xs font-semibold gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingUser ? (
                    'Simpan Perubahan'
                  ) : (
                    'Buat Akun'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

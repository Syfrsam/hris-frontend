import React, { useEffect, useState } from 'react'
import {
  Add01Icon,
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Edit02Icon,
  FloppyDiskIcon,
  InformationCircleIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { branchService, shiftService } from '../../services/api'
import type { Branch, Shift } from '../../types'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Skeleton } from '../ui/skeleton'

// SVG Delete icon
const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export const ShiftSettings: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deleteTargetShift, setDeleteTargetShift] = useState<Shift | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Form states
  const [formData, setFormData] = useState<{
    name: string
    start_time: string
    end_time: string
    late_tolerance_minutes: number
    branch_id: number | null
    is_active: boolean
  }>({
    name: '',
    start_time: '08:30',
    end_time: '17:30',
    late_tolerance_minutes: 15,
    branch_id: null,
    is_active: true,
  })

  const loadData = async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const [shiftRes, branchRes] = await Promise.all([
        shiftService.getShifts().catch(() => null),
        branchService.getBranches().catch(() => null),
      ])

      if (shiftRes?.data?.success) {
        setShifts(shiftRes.data.data)
      }
      if (branchRes?.data?.success) {
        setBranches(branchRes.data.data)
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat jadwal shift.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingShift(null)
    setFormData({
      name: '',
      start_time: '08:30',
      end_time: '17:30',
      late_tolerance_minutes: 15,
      branch_id: null,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      start_time: shift.start_time ? shift.start_time.slice(0, 5) : '08:30',
      end_time: shift.end_time ? shift.end_time.slice(0, 5) : '17:30',
      late_tolerance_minutes: shift.late_tolerance_minutes ?? 15,
      branch_id: shift.branch_id ?? null,
      is_active: shift.is_active ?? true,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingShift(null)
  }

  // Calculate duration between start and end time
  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '-'

    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60 // Shift crosses midnight
    }

    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return `${hours} Jam ${mins > 0 ? `${mins} Menit` : ''}`.trim()
  }

  // Calculate late tolerance cutoff time
  const calculateCutoff = (start: string, tolMinutes: number) => {
    const [startH, startM] = start.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM)) return '-'

    const total = startH * 60 + startM + tolMinutes
    const cutH = Math.floor(total / 60) % 24
    const cutM = total % 60
    return `${String(cutH).padStart(2, '0')}:${String(cutM).padStart(2, '0')}`
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Nama shift wajib diisi.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      if (editingShift) {
        const res = await shiftService.updateShift(editingShift.id, formData)
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Jadwal shift "${formData.name}" berhasil diperbarui.`,
          })
          closeModal()
          loadData()
        }
      } else {
        const res = await shiftService.createShift(formData)
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: `Jadwal shift baru "${formData.name}" berhasil ditambahkan.`,
          })
          closeModal()
          loadData()
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan jadwal shift.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTargetShift) return
    setIsDeleting(true)
    setFeedback(null)

    try {
      const res = await shiftService.deleteShift(deleteTargetShift.id)
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Jadwal shift "${deleteTargetShift.name}" berhasil dihapus.`,
        })
        setDeleteTargetShift(null)
        loadData()
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menghapus jadwal shift.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const activeCount = shifts.filter((s) => s.is_active).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Jadwal Shift & Jam Kerja
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi jam masuk, jam pulang, dan batas toleransi keterlambatan presensi karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-10 px-3 cursor-pointer"
          >
            <Icon icon={RefreshIcon} size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="ml-1.5 hidden sm:inline">Muat Ulang</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="h-10 px-4 cursor-pointer"
          >
            <Icon icon={Add01Icon} size={16} />
            <span className="ml-1.5 font-medium">Tambah Shift</span>
          </Button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-200'
          }`}
        >
          <Icon
            icon={feedback.type === 'success' ? CheckmarkCircle01Icon : Alert02Icon}
            size={18}
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
          >
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Highlight Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-card border-border/80 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Total Shift
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? <Skeleton className="h-7 w-12" /> : shifts.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {activeCount} shift aktif
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/80 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Jam Masuk Standar
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : shifts[0]?.start_time ? (
              `${shifts[0].start_time.slice(0, 5)} WIB`
            ) : (
              '08:30 WIB'
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {shifts[0]?.name || 'Shift Utama'}
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/80 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Jam Pulang Standar
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : shifts[0]?.end_time ? (
              `${shifts[0].end_time.slice(0, 5)} WIB`
            ) : (
              '17:30 WIB'
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Durasi {shifts[0] ? calculateDuration(shifts[0].start_time.slice(0, 5), shifts[0].end_time.slice(0, 5)) : '9 Jam'}
          </div>
        </Card>

        <Card className="p-4 bg-card border-border/80 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Toleransi Terlambat
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              `${shifts[0]?.late_tolerance_minutes ?? 15} Menit`
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Batas tepat waktu s/d{' '}
            {shifts[0]
              ? calculateCutoff(shifts[0].start_time.slice(0, 5), shifts[0].late_tolerance_minutes ?? 15)
              : '08:45'}
          </div>
        </Card>
      </div>

      {/* Main Shift Listing */}
      <Card className="p-0 overflow-hidden border-border/80 shadow-xs">
        <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold">Daftar Jadwal Shift Kerja</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Jadwal yang digunakan mesin presensi untuk kalkulasi tepat waktu & keterlambatan.
            </CardDescription>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-12 text-center">
            <Icon icon={Clock01Icon} size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Belum ada jadwal shift</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Tambahkan shift kerja baru agar karyawan dapat melakukan presensi dengan jam kerja yang teratur.
            </p>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="mt-4 h-10 px-4 cursor-pointer"
            >
              <Icon icon={Add01Icon} size={16} />
              <span className="ml-1.5">Tambah Shift Pertama</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Shift</th>
                    <th className="py-3 px-4">Jam Kerja</th>
                    <th className="py-3 px-4">Toleransi</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {shifts.map((shift) => {
                    const start = shift.start_time ? shift.start_time.slice(0, 5) : '08:30'
                    const end = shift.end_time ? shift.end_time.slice(0, 5) : '17:30'
                    const tol = shift.late_tolerance_minutes ?? 15
                    const cutoff = calculateCutoff(start, tol)
                    const duration = calculateDuration(start, end)

                    return (
                      <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{shift.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Durasi {duration}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">
                            {start} - {end} <span className="text-xs text-muted-foreground">WIB</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">{tol} Menit</div>
                          <div className="text-xs text-muted-foreground mt-0.5">s/d {cutoff} WIB</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {shift.branch?.name || 'Semua Cabang'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={shift.is_active ? 'success' : 'secondary'}
                            className="text-[11px]"
                          >
                            {shift.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(shift)}
                              className="h-8.5 px-2.5 text-xs cursor-pointer"
                            >
                              <Icon icon={Edit02Icon} size={14} />
                              <span className="ml-1">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTargetShift(shift)}
                              className="h-8.5 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span className="ml-1">Hapus</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Reflow (< 640px) */}
            <div className="block sm:hidden divide-y divide-border/60">
              {shifts.map((shift) => {
                const start = shift.start_time ? shift.start_time.slice(0, 5) : '08:30'
                const end = shift.end_time ? shift.end_time.slice(0, 5) : '17:30'
                const tol = shift.late_tolerance_minutes ?? 15
                const cutoff = calculateCutoff(start, tol)
                const duration = calculateDuration(start, end)

                return (
                  <div key={shift.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground text-sm">{shift.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {shift.branch?.name || 'Semua Cabang'}
                        </div>
                      </div>
                      <Badge
                        variant={shift.is_active ? 'success' : 'secondary'}
                        className="text-[11px] shrink-0"
                      >
                        {shift.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <div className="text-muted-foreground">Jam Kerja:</div>
                        <div className="font-semibold text-foreground mt-0.5">
                          {start} - {end} WIB
                        </div>
                        <div className="text-[10px] text-muted-foreground">Durasi {duration}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Toleransi Keterlambatan:</div>
                        <div className="font-semibold text-foreground mt-0.5">{tol} Menit</div>
                        <div className="text-[10px] text-muted-foreground">s/d {cutoff} WIB</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(shift)}
                        className="flex-1 h-11 text-xs cursor-pointer"
                      >
                        <Icon icon={Edit02Icon} size={14} />
                        <span className="ml-1">Edit Shift</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTargetShift(shift)}
                        className="h-11 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span className="ml-1">Hapus</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* Info Card explaining Attendance Logic */}
      <Card className="p-4 sm:p-5 bg-muted/30 border-border/80">
        <div className="flex items-start gap-3">
          <Icon icon={InformationCircleIcon} size={20} className="shrink-0 text-primary mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Bagaimana sistem menghitung keterlambatan?</div>
            <p>
              Karyawan yang melakukan presensi masuk sebelum jam masuk atau dalam rentang toleransi
              keterlambatan akan dicatat sebagai <strong>Tepat Waktu</strong>.
            </p>
            <p>
              Jika presensi masuk dilakukan setelah waktu toleransi habis (misal lewat dari batas cut-off),
              sistem secara otomatis mencatat status <strong>Terlambat</strong> dan menghitung total menit
              keterlambatan sebagai dasar penalti denda payroll.
            </p>
          </div>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {editingShift ? 'Edit Jadwal Shift' : 'Tambah Jadwal Shift Baru'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tentukan jam masuk, jam pulang, dan toleransi kehadiran.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Icon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Shift Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nama Jadwal Shift <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Shift Reguler, Shift Pagi, Shift Middle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10 text-sm"
                />
              </div>

              {/* Work Hours: Start Time & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Jam Masuk <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Jam Pulang <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Late Tolerance & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Toleransi Terlambat (Menit) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.late_tolerance_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        late_tolerance_minutes: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    required
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Batas toleransi kehadiran tepat waktu.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Cabang Kantor (Opsional)
                  </label>
                  <select
                    value={formData.branch_id ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branch_id: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Semua Cabang Kantor</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="shift-active-toggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary border-input focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="shift-active-toggle"
                  className="text-xs sm:text-sm font-medium text-foreground cursor-pointer"
                >
                  Aktifkan jadwal shift ini untuk presensi harian
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5 text-xs">
                <div className="font-semibold text-primary">Ringkasan Konfigurasi:</div>
                <div className="text-muted-foreground">
                  Durasi jam kerja: <strong>{calculateDuration(formData.start_time, formData.end_time)}</strong>
                </div>
                <div className="text-muted-foreground">
                  Batas tepat waktu s/d{' '}
                  <strong>{calculateCutoff(formData.start_time, formData.late_tolerance_minutes)} WIB</strong>.
                  Presensi setelah waktu ini dicatat terlambat.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="h-10 px-4 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Icon icon={RefreshIcon} size={16} className="animate-spin mr-1.5" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={FloppyDiskIcon} size={16} className="mr-1.5" />
                      <span>{editingShift ? 'Simpan Perubahan' : 'Buat Shift'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <Icon icon={Alert02Icon} size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Hapus Jadwal Shift?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Apakah Anda yakin ingin menghapus jadwal shift{' '}
                  <strong className="text-foreground">"{deleteTargetShift.name}"</strong>? Shift yang dihapus
                  tidak dapat dipulihkan kembali.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTargetShift(null)}
                disabled={isDeleting}
                className="h-10 px-4 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Shift'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

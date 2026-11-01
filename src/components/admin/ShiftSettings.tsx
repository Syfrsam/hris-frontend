import React, { useEffect, useMemo, useState } from 'react'
import {
  Add01Icon,
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Edit02Icon,
  FloppyDiskIcon,
  InformationCircleIcon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { branchService, shiftService } from '../../services/api'
import type { Branch, Shift } from '../../types'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { SkeletonBox } from '../ui/skeleton'
import { Pagination } from '../common/Pagination'

type QuickFilterKey = 'all' | 'active' | 'branch' | 'inactive'

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
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

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeFilterKey, setActiveFilterKey] = useState<QuickFilterKey>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

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

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true)
    setFeedback(null)
    try {
      const [shiftRes, branchRes] = await Promise.all([
        shiftService.getShifts().catch(() => null),
        branchService.getBranches().catch(() => null),
        showSkeleton ? new Promise((r) => setTimeout(r, 400)) : Promise.resolve(),
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
      if (showSkeleton) setIsLoading(false)
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

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '-'

    let diffMinutes = endH * 60 + endM - (startH * 60 + startM)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }

    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return `${hours} Jam ${mins > 0 ? `${mins} Menit` : ''}`.trim()
  }

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

  // Filtered shifts based on search query and selected filter card
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchQuery =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.branch?.name && s.branch.name.toLowerCase().includes(searchQuery.toLowerCase()))

      let matchFilter = true
      if (activeFilterKey === 'active') matchFilter = s.is_active !== false
      if (activeFilterKey === 'inactive') matchFilter = s.is_active === false
      if (activeFilterKey === 'branch') matchFilter = Boolean(s.branch_id)

      return matchQuery && matchFilter
    })
  }, [shifts, searchQuery, activeFilterKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilterKey])

  const paginatedShifts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredShifts.slice(start, start + pageSize)
  }, [filteredShifts, currentPage, pageSize])

  const isFilterActive = searchQuery !== '' || activeFilterKey !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setActiveFilterKey('all')
    setCurrentPage(1)
  }

  const totalCount = shifts.length
  const activeCount = shifts.filter((s) => s.is_active !== false).length
  const branchCount = shifts.filter((s) => Boolean(s.branch_id)).length
  const inactiveCount = shifts.filter((s) => s.is_active === false).length

  return (
    <div className="space-y-5 sm:space-y-6 font-sans text-xs sm:text-sm">
      {/* Header Banner - Matches Peraturan Denda & Master Cuti */}
      <div className="bg-primary text-primary-foreground p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-base sm:text-xl font-semibold tracking-tight text-white">
              Jadwal Shift & Jam Kerja
            </h2>
            <p className="text-primary-foreground/85 text-xs mt-1 font-normal leading-relaxed">
              Atur jam masuk, jam pulang, toleransi keterlambatan presensi, dan jadwal operasional kerja karyawan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isLoading}
              className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Segarkan data shift"
            >
              <Icon icon={RefreshIcon} size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="h-8.5 px-3.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Icon icon={Add01Icon} size={14} />
              <span>Tambah Shift</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner - Matches Peraturan Denda */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 sm:p-4 rounded-xl text-xs flex items-start space-x-2.5 border font-normal transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
          }`}
        >
          <Icon
            icon={feedback.type === 'success' ? CheckmarkCircle01Icon : AlertCircleIcon}
            size={16}
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 leading-relaxed">{feedback.message}</div>
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

      {/* Scheme Cards - Matches Master Cuti & Peraturan Denda Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'all' as QuickFilterKey,
            label: 'Semua Shift',
            desc: 'Seluruh jadwal kerja master',
            count: totalCount,
            subtitle: `${activeCount} shift aktif`,
          },
          {
            key: 'active' as QuickFilterKey,
            label: 'Shift Aktif',
            desc: 'Berlaku pada mesin presensi',
            count: activeCount,
            subtitle: 'Digunakan harian',
          },
          {
            key: 'branch' as QuickFilterKey,
            label: 'Khusus Cabang',
            desc: 'Jadwal spesifik kantor',
            count: branchCount,
            subtitle: `${branchCount} lokasi cabang`,
          },
          {
            key: 'inactive' as QuickFilterKey,
            label: 'Nonaktif / Arsip',
            desc: 'Disembunyikan dari presensi',
            count: inactiveCount,
            subtitle: 'Arsip kebijakan',
          },
        ].map((card) => {
          const isSelected = activeFilterKey === card.key
          return (
            <div
              key={card.key}
              onClick={() => setActiveFilterKey(card.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">{card.label}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-normal leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="h-7 flex items-center">
                  {isLoading ? (
                    <SkeletonBox height={22} width={38} radius={6} />
                  ) : (
                    <span className="text-xl font-medium text-foreground tabular-nums tracking-tight">
                      {card.count}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-normal">
                {isLoading ? (
                  <SkeletonBox height={11} width={80} radius={4} />
                ) : (
                  <span>{card.subtitle}</span>
                )}
                <span className={isSelected ? 'text-primary font-medium' : 'text-muted-foreground/80'}>
                  {isSelected ? 'Aktif Terfilter' : 'Klik Filter'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Table Card - Matches Master Cuti & Role Management */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        {/* Card Header & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon={Clock01Icon} size={18} className="text-primary" />
              <span>Daftar Master Jadwal Shift & Jam Masuk</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
              Jadwal yang digunakan sistem untuk evaluasi presensi tepat waktu dan denda keterlambatan.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Icon
                icon={Search01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jadwal shift..."
                className="pl-8 text-xs h-8.5 rounded-xl border-border bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <Icon icon={Cancel01Icon} size={12} />
                </button>
              )}
            </div>

            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-primary hover:text-primary gap-1 h-8 px-2 cursor-pointer rounded-xl font-normal"
              >
                <Icon icon={Cancel01Icon} size={12} />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <>
            {/* Desktop Table Skeleton (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left border-collapse table-fixed text-xs">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Shift</th>
                    <th className="py-2.5 px-3">Jam Masuk - Pulang</th>
                    <th className="py-2.5 px-3">Toleransi Terlambat</th>
                    <th className="py-2.5 px-3">Cabang Kantor</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      {/* Nama Shift & Durasi */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-1">
                          <SkeletonBox height={14} width="72%" radius={4} />
                          <SkeletonBox height={10} width="45%" radius={4} />
                        </div>
                      </td>

                      {/* Jam Masuk - Pulang */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <SkeletonBox height={14} width="65%" radius={4} />
                      </td>

                      {/* Toleransi Terlambat */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-1">
                          <SkeletonBox height={14} width="55%" radius={4} />
                          <SkeletonBox height={10} width="40%" radius={4} />
                        </div>
                      </td>

                      {/* Cabang Kantor */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <SkeletonBox height={13} width="70%" radius={4} />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <SkeletonBox height={18} width={48} radius={999} />
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <SkeletonBox height={28} width={50} radius={8} />
                          <SkeletonBox height={28} width={54} radius={8} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List Skeleton (< 640px) */}
            <div className="block sm:hidden divide-y divide-border rounded-xl border border-border/80 overflow-hidden bg-card">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 space-y-2.5 bg-card">
                  {/* Header: Shift Name & Branch + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <SkeletonBox height={14} width="65%" radius={4} />
                      <SkeletonBox height={10} width="45%" radius={4} />
                    </div>
                    <SkeletonBox height={18} width={48} radius={999} className="shrink-0" />
                  </div>

                  {/* 2-Column Detail Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                    <div className="space-y-1">
                      <SkeletonBox height={10} width={50} radius={3} />
                      <SkeletonBox height={13} width="80%" radius={3} />
                      <SkeletonBox height={10} width="55%" radius={3} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width={65} radius={3} />
                      <SkeletonBox height={13} width="70%" radius={3} />
                      <SkeletonBox height={10} width="60%" radius={3} />
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <SkeletonBox height={32} width="100%" radius={8} className="flex-1" />
                    <SkeletonBox height={32} width={60} radius={8} className="shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredShifts.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Icon icon={Clock01Icon} size={36} className="mx-auto text-muted-foreground/40" />
            <div className="text-xs font-semibold text-foreground">
              {searchQuery ? 'Tidak ada shift yang cocok' : 'Belum ada data shift'}
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan hasil pencarian untuk "${searchQuery}". Coba kata kunci lain.`
                : 'Silakan tambahkan jadwal shift kerja baru untuk mengatur jam presensi karyawan.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left border-collapse table-fixed text-xs">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Shift</th>
                    <th className="py-2.5 px-3">Jam Masuk - Pulang</th>
                    <th className="py-2.5 px-3">Toleransi Terlambat</th>
                    <th className="py-2.5 px-3">Cabang Kantor</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedShifts.map((shift) => {
                    const start = shift.start_time ? shift.start_time.slice(0, 5) : '08:30'
                    const end = shift.end_time ? shift.end_time.slice(0, 5) : '17:30'
                    const tol = shift.late_tolerance_minutes ?? 15
                    const cutoff = calculateCutoff(start, tol)
                    const duration = calculateDuration(start, end)

                    return (
                      <tr key={shift.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="font-semibold text-foreground truncate">{shift.name}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Durasi {duration}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="font-medium text-foreground">
                            {start} - {end} <span className="text-[10px] text-muted-foreground">WIB</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="font-medium text-foreground">{tol} Menit</div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            s/d {cutoff} WIB
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-middle text-muted-foreground truncate">
                          {shift.branch?.name || (
                            <span className="text-muted-foreground/70 font-normal">Semua Cabang</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                          <Badge
                            variant={shift.is_active ? 'success' : 'secondary'}
                            className="text-[10px] px-2 py-0.2"
                          >
                            {shift.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(shift)}
                              className="h-7.5 px-2.5 text-xs rounded-lg cursor-pointer font-medium"
                            >
                              <Icon icon={Edit02Icon} size={13} />
                              <span className="ml-1">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTargetShift(shift)}
                              className="h-7.5 px-2 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer font-medium"
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

            {/* Mobile Card List View (< 640px) */}
            <div className="block sm:hidden divide-y divide-border rounded-xl border border-border/80 overflow-hidden bg-card">
              {paginatedShifts.map((shift) => {
                const start = shift.start_time ? shift.start_time.slice(0, 5) : '08:30'
                const end = shift.end_time ? shift.end_time.slice(0, 5) : '17:30'
                const tol = shift.late_tolerance_minutes ?? 15
                const cutoff = calculateCutoff(start, tol)
                const duration = calculateDuration(start, end)

                return (
                  <div key={shift.id} className="p-3.5 space-y-2.5 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-xs truncate">{shift.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {shift.branch?.name || 'Semua Cabang Kantor'}
                        </div>
                      </div>
                      <Badge
                        variant={shift.is_active ? 'success' : 'secondary'}
                        className="text-[10px] px-2 py-0.2 shrink-0"
                      >
                        {shift.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Jam Kerja:</div>
                        <div className="font-semibold text-foreground mt-0.5 text-xs truncate">
                          {start} - {end} WIB
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">Durasi {duration}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Toleransi Terlambat:</div>
                        <div className="font-semibold text-foreground mt-0.5 text-xs truncate">{tol} Menit</div>
                        <div className="text-[10px] text-muted-foreground truncate">s/d {cutoff} WIB</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(shift)}
                        className="flex-1 h-8 text-xs rounded-lg cursor-pointer font-medium"
                      >
                        <Icon icon={Edit02Icon} size={13} />
                        <span className="ml-1">Edit Shift</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTargetShift(shift)}
                        className="h-8 px-2.5 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer font-medium shrink-0"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span className="ml-1">Hapus</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredShifts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>

      {/* Info Card - Consistent with Leave & Penalty Settings */}
      <Card className="p-4 sm:p-5 bg-card border border-border rounded-2xl shadow-xs">
        <div className="flex items-start gap-3">
          <Icon icon={InformationCircleIcon} size={18} className="shrink-0 text-primary mt-0.5" />
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Ketentuan Toleransi Presensi & Denda</div>
            <p className="leading-relaxed">
              Karyawan yang melakukan presensi masuk dalam rentang toleransi keterlambatan akan diakui sebagai{' '}
              <strong className="text-foreground">Tepat Waktu</strong>. Presensi setelah cut-off toleransi akan
              otomatis dicatat sebagai <strong className="text-foreground">Terlambat</strong> dan dihitung
              dalam kalkulasi denda payroll bulanan.
            </p>
          </div>
        </div>
      </Card>

      {/* Add / Edit Modal - Matches Master Cuti & User Management */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="dark" className="text-[9px] px-1.5 py-0.2">
                    Superadmin
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground">
                    {editingShift ? 'Edit Konfigurasi Shift' : 'Tambah Jadwal Shift Baru'}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {editingShift
                    ? `Perbarui jam masuk, jam pulang, dan toleransi untuk ${editingShift.name}.`
                    : 'Daftarkan jadwal shift kerja baru untuk perhitungan presensi karyawan.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                aria-label="Tutup modal"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <form id="shift-settings-form" onSubmit={handleSave} className="space-y-3.5 text-xs">
                {/* Shift Name */}
                <div className="space-y-1">
                  <label className="font-medium text-foreground block">
                    Nama Jadwal Shift <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Shift Reguler (Pagi)"
                    className="text-xs h-8.5 rounded-lg"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Label shift yang tampil pada portal dan widget presensi karyawan.
                  </p>
                </div>

                {/* Work Hours: Start Time & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Jam Masuk Presensi <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="text-xs h-8.5 rounded-lg"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Waktu awal mulai jam kerja kantor.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Jam Pulang Presensi <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="text-xs h-8.5 rounded-lg"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Waktu akhir jam kerja kantor.</p>
                  </div>
                </div>

                {/* Late Tolerance & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
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
                      className="text-xs h-8.5 rounded-lg"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Batas menit keterlambatan yang masih diakui tepat waktu.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">Cabang Kantor</label>
                    <select
                      value={formData.branch_id ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branch_id: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      className="w-full h-8.5 px-3 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Semua Cabang Kantor</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground">Pilih cabang atau biarkan untuk semua.</p>
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-foreground font-medium block">Status Aktif</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Jadwal shift aktif dan dapat diterapkan pada presensi karyawan.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Calculation Summary Pill */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                  <div className="font-semibold text-primary">Simulasi Jadwal:</div>
                  <div className="text-muted-foreground text-[11px]">
                    Durasi kerja: <strong>{calculateDuration(formData.start_time, formData.end_time)}</strong>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Batas tepat waktu s/d{' '}
                    <strong>{calculateCutoff(formData.start_time, formData.late_tolerance_minutes)} WIB</strong>.
                    Presensi setelah waktu ini dicatat terlambat.
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0 bg-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={isSaving}
                className="h-8 text-xs cursor-pointer font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="shift-settings-form"
                size="sm"
                disabled={isSaving}
                className="h-8 px-4 text-xs font-medium cursor-pointer rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Icon icon={RefreshIcon} size={14} className="animate-spin mr-1.5" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={FloppyDiskIcon} size={14} className="mr-1.5" />
                    <span>{editingShift ? 'Simpan Perubahan' : 'Buat Shift'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Matches User Management */}
      {deleteTargetShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setDeleteTargetShift(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm my-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <TrashIcon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Hapus Jadwal Shift?</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Apakah Anda yakin ingin menghapus jadwal shift{' '}
                  <strong className="text-foreground">"{deleteTargetShift.name}"</strong>? Data yang telah dihapus
                  tidak dapat dipulihkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetShift(null)}
                disabled={isDeleting}
                className="h-8 text-xs cursor-pointer font-medium"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 text-xs cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

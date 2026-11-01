import React, { useEffect, useMemo, useState } from 'react'
import {
  Add01Icon,
  AlertCircleIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  FilterIcon,
  InformationCircleIcon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Input } from '../ui/input'
import { SkeletonBox } from '../ui/skeleton'
import { leaveService } from '../../services/api'
import type { LeaveType } from '../../types'

// Pixel-perfect chevron down for custom select inputs
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

type QuickFilterKey = 'all' | 'deduct' | 'attachment' | 'inactive'

export const LeaveTypeSettings: React.FC = () => {
  const [types, setTypes] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [quotaFilter, setQuotaFilter] = useState<'all' | 'deduct' | 'non_deduct'>('all')
  const [activeCardKey, setActiveCardKey] = useState<QuickFilterKey>('all')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [editingType, setEditingType] = useState<LeaveType | null>(null)
  const [code, setCode] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [defaultQuota, setDefaultQuota] = useState<number>(12)
  const [minNoticeDays, setMinNoticeDays] = useState<number>(3)
  const [deductQuota, setDeductQuota] = useState<boolean>(true)
  const [requiresAttachment, setRequiresAttachment] = useState<boolean>(false)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchLeaveTypes = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    setFeedback(null)
    try {
      const res = await leaveService.getAllTypes()
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTypes(res.data.data)
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat daftar master jenis cuti.',
      })
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const openAddModal = () => {
    setEditingType(null)
    setCode('')
    setName('')
    setDefaultQuota(12)
    setMinNoticeDays(3)
    setDeductQuota(true)
    setRequiresAttachment(false)
    setIsActive(true)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditModal = (item: LeaveType) => {
    setEditingType(item)
    setCode(item.code)
    setName(item.name)
    setDefaultQuota(item.default_quota ?? 0)
    setMinNoticeDays(item.min_notice_days ?? 0)
    setDeductQuota(item.deduct_quota ?? false)
    setRequiresAttachment(item.requires_attachment ?? false)
    setIsActive(item.is_active ?? true)
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Nama jenis cuti wajib diisi.')
      return
    }

    if (!editingType && !code.trim()) {
      setFormError('Kode jenis cuti wajib diisi.')
      return
    }

    setIsSaving(true)
    try {
      if (editingType) {
        await leaveService.updateType(editingType.id, {
          name: name.trim(),
          default_quota: Number(defaultQuota) || 0,
          deduct_quota: deductQuota,
          min_notice_days: Number(minNoticeDays) || 0,
          requires_attachment: requiresAttachment,
          is_active: isActive,
        })
        setFeedback({ type: 'success', message: `Jenis cuti "${name.trim()}" berhasil diperbarui.` })
      } else {
        await leaveService.createType({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          default_quota: Number(defaultQuota) || 0,
          deduct_quota: deductQuota,
          min_notice_days: Number(minNoticeDays) || 0,
          requires_attachment: requiresAttachment,
          is_active: isActive,
        })
        setFeedback({ type: 'success', message: `Jenis cuti baru "${name.trim()}" berhasil ditambahkan.` })
      }
      setIsFormOpen(false)
      fetchLeaveTypes(true)
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan perubahan jenis cuti.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (item: LeaveType) => {
    try {
      await leaveService.deleteType(item.id)
      setFeedback({
        type: 'success',
        message: `Status jenis cuti "${item.name}" berhasil diubah menjadi ${item.is_active ? 'Nonaktif' : 'Aktif'}.`,
      })
      fetchLeaveTypes(true)
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status jenis cuti.',
      })
    }
  }

  // Handle Quick Filter clicks
  const handleCardClick = (key: QuickFilterKey) => {
    setActiveCardKey(key)
    setCurrentPage(1)
    if (key === 'all') {
      setStatusFilter('all')
      setQuotaFilter('all')
    } else if (key === 'deduct') {
      setQuotaFilter('deduct')
      setStatusFilter('all')
    } else if (key === 'attachment') {
      setQuotaFilter('all')
      setStatusFilter('all')
    } else if (key === 'inactive') {
      setStatusFilter('inactive')
      setQuotaFilter('all')
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setQuotaFilter('all')
    setActiveCardKey('all')
    setCurrentPage(1)
  }

  // Filtered list
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const matchQuery =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase())

      let matchStatus = true
      if (statusFilter === 'active') matchStatus = t.is_active !== false
      if (statusFilter === 'inactive') matchStatus = t.is_active === false

      let matchQuota = true
      if (quotaFilter === 'deduct') matchQuota = t.deduct_quota === true
      if (quotaFilter === 'non_deduct') matchQuota = t.deduct_quota === false

      let matchQuickCard = true
      if (activeCardKey === 'attachment') {
        matchQuickCard = t.requires_attachment === true
      }

      return matchQuery && matchStatus && matchQuota && matchQuickCard
    })
  }, [types, searchQuery, statusFilter, quotaFilter, activeCardKey])

  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTypes.slice(start, start + pageSize)
  }, [filteredTypes, currentPage, pageSize])

  const isFilterActive =
    searchQuery !== '' || statusFilter !== 'all' || quotaFilter !== 'all' || activeCardKey !== 'all'

  // Statistics
  const totalCount = types.length
  const activeCount = types.filter((t) => t.is_active !== false).length
  const deductQuotaCount = types.filter((t) => t.deduct_quota).length
  const attachmentRequiredCount = types.filter((t) => t.requires_attachment).length

  return (
    <div className="space-y-5 sm:space-y-6 font-sans">
      {/* Header Banner - Matches Peraturan Denda */}
      <div className="bg-primary text-primary-foreground p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-base sm:text-xl font-semibold tracking-tight text-white">
              Master Jenis Cuti & Izin
            </h2>
            <p className="text-primary-foreground/85 text-xs mt-1 font-normal leading-relaxed">
              Atur skema cuti tahunan, toleransi pengajuan shift, batas minimal hari (H-N), dan kewajiban surat dokter.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchLeaveTypes(true)}
              disabled={isLoading}
              className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Segarkan data jenis cuti"
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
              onClick={openAddModal}
              className="h-8.5 px-3.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Icon icon={Add01Icon} size={14} />
              <span>Tambah Jenis Cuti</span>
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
          {feedback.type === 'success' ? (
            <Icon icon={CheckmarkCircle01Icon} size={16} className="shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <Icon icon={AlertCircleIcon} size={16} className="shrink-0 text-rose-500 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
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

      {/* Scheme Cards - Matches Peraturan Denda Card Styles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'all' as QuickFilterKey,
            label: 'Semua Kategori',
            desc: 'Seluruh jenis cuti & izin',
            count: totalCount,
            subtitle: `${activeCount} kategori aktif`,
          },
          {
            key: 'deduct' as QuickFilterKey,
            label: 'Potong Kuota',
            desc: 'Mengurangi saldo tahunan',
            count: deductQuotaCount,
            subtitle: `${deductQuotaCount} jenis cuti`,
          },
          {
            key: 'attachment' as QuickFilterKey,
            label: 'Wajib Dokumen',
            desc: 'Surat dokter / bukti resmi',
            count: attachmentRequiredCount,
            subtitle: `${attachmentRequiredCount} jenis cuti`,
          },
          {
            key: 'inactive' as QuickFilterKey,
            label: 'Nonaktif / Arsip',
            desc: 'Disembunyikan dari pengajuan',
            count: totalCount - activeCount,
            subtitle: 'Arsip kebijakan',
          },
        ].map((card) => {
          const isSelected = activeCardKey === card.key
          return (
            <div
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">
                    {card.label}
                  </div>
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

      {/* Main Table Card - Matches Peraturan Denda Card Container */}
      <Card className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        {/* Card Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon={Calendar03Icon} size={18} className="text-primary" />
              <span>Daftar Master Jenis Cuti & Ketentuan</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
              Atur dan sesuaikan batasan kuota, minimal pengajuan, dan syarat dokumen lampiran.
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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Cari kode atau nama..."
                aria-label="Cari jenis cuti"
                className="pl-8.5 pr-7 h-8.5 text-xs rounded-xl"
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

            {/* Status Filter Dropdown */}
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <select
                aria-label="Filter status aktif"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto h-8.5 pl-3 pr-8 rounded-xl border border-input bg-background text-xs font-normal text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            {/* Quota Filter Dropdown */}
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <select
                aria-label="Filter pemotongan kuota"
                value={quotaFilter}
                onChange={(e) => {
                  setQuotaFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto h-8.5 pl-3 pr-8 rounded-xl border border-input bg-background text-xs font-normal text-foreground focus:ring-1 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <option value="all">Semua Jenis Kuota</option>
                <option value="deduct">Potong Kuota</option>
                <option value="non_deduct">Tidak Potong</option>
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

        {/* Loading State - 1:1 Matching Skullet Table & Mobile Skeleton */}
        {isLoading ? (
          <>
            {/* Desktop Table Skeleton (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                    <th className="py-2.5 px-3 text-left">Kode & Jenis Cuti</th>
                    <th className="py-2.5 px-3 text-left">Skema Kuota Tahunan</th>
                    <th className="py-2.5 px-3 text-left">Ketentuan Pengajuan</th>
                    <th className="py-2.5 px-2 text-left whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      {/* Kode & Nama */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <SkeletonBox height={20} width={38} radius={4} className="shrink-0" />
                          <SkeletonBox height={14} width="65%" radius={4} />
                        </div>
                      </td>

                      {/* Skema Kuota */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-1">
                          <SkeletonBox height={14} width="70%" radius={4} />
                          <SkeletonBox height={11} width="50%" radius={4} />
                        </div>
                      </td>

                      {/* Ketentuan Pengajuan */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-1">
                          <SkeletonBox height={14} width="60%" radius={4} />
                          <SkeletonBox height={16} width={90} radius={4} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 align-middle whitespace-nowrap">
                        <SkeletonBox height={18} width={52} radius={999} />
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <SkeletonBox height={28} width={52} radius={8} />
                          <SkeletonBox height={28} width={68} radius={8} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List Skeleton (< 640px) */}
            <div className="sm:hidden divide-y divide-border rounded-xl border border-border/80 overflow-hidden bg-card">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <SkeletonBox height={20} width={38} radius={4} className="shrink-0" />
                      <SkeletonBox height={14} width="55%" radius={4} />
                    </div>
                    <SkeletonBox height={18} width={50} radius={999} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                    <div className="space-y-1">
                      <SkeletonBox height={10} width={60} radius={3} />
                      <SkeletonBox height={13} width={80} radius={3} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width={60} radius={3} />
                      <SkeletonBox height={13} width={70} radius={3} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-1.5">
                    <SkeletonBox height={26} width={50} radius={8} />
                    <SkeletonBox height={26} width={65} radius={8} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredTypes.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Icon icon={Search01Icon} size={18} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Tidak Ada Jenis Cuti yang Sesuai</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isFilterActive
                  ? 'Tidak ada jenis cuti yang cocok dengan kata kunci atau filter yang Anda pilih.'
                  : 'Belum ada jenis cuti terdaftar di sistem.'}
              </p>
            </div>
            {isFilterActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-7.5 text-xs cursor-pointer rounded-lg">
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                    <th className="py-2.5 px-3 text-left">Kode & Jenis Cuti</th>
                    <th className="py-2.5 px-3 text-left">Skema Kuota Tahunan</th>
                    <th className="py-2.5 px-3 text-left">Ketentuan Pengajuan</th>
                    <th className="py-2.5 px-2 text-left whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedTypes.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/25 transition-colors ${
                        item.is_active === false ? 'opacity-60 bg-muted/10' : ''
                      }`}
                    >
                      {/* Kode & Nama */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-normal bg-muted text-muted-foreground border border-border shrink-0">
                            {item.code}
                          </span>
                          <span className="text-xs font-normal text-foreground truncate block min-w-0" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Skema Kuota Tahunan (Kuota + Potong Status) */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-normal text-foreground truncate block">
                            {item.default_quota > 0 ? (
                              <span>
                                {item.default_quota} hari{' '}
                                <span className="text-muted-foreground text-[11px]">/ tahun</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Tanpa kuota (0 hari)</span>
                            )}
                          </div>
                          <div>
                            {item.deduct_quota ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-normal bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                                Potong Kuota
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Tidak Potong Kuota
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ketentuan Pengajuan (Min Hari + Syarat Dokumen) */}
                      <td className="py-2.5 px-3 align-middle overflow-hidden">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-normal text-foreground truncate block">
                            {item.min_notice_days > 0 ? (
                              <span>
                                Min. H-{item.min_notice_days}{' '}
                                <span className="text-muted-foreground text-[11px]">hari kerja</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Hari-H (fleksibel)</span>
                            )}
                          </div>
                          <div>
                            {item.requires_attachment ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-normal bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                Wajib Surat Dokter
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                Tanpa Lampiran
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-normal">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_active !== false ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                            }`}
                          />
                          <span className={item.is_active !== false ? 'text-foreground' : 'text-muted-foreground'}>
                            {item.is_active !== false ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="h-7 px-2 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Icon icon={Edit01Icon} size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`h-7 px-2 rounded-lg text-xs font-normal border transition-colors cursor-pointer shrink-0 ${
                              item.is_active !== false
                                ? 'border-border/60 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 hover:border-rose-200'
                                : 'border-border/60 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-200'
                            }`}
                          >
                            <span>{item.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="sm:hidden divide-y divide-border rounded-xl border border-border/80 overflow-hidden">
              {paginatedTypes.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 space-y-2.5 transition-colors ${
                    item.is_active === false ? 'opacity-65 bg-muted/15' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-normal text-foreground border border-border shrink-0">
                        {item.code}
                      </span>
                      <span className="font-normal text-xs text-foreground truncate">
                        {item.name}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-normal shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.is_active !== false ? 'bg-emerald-500' : 'bg-muted-foreground'
                        }`}
                      />
                      <span className={item.is_active !== false ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/20 p-2.5 rounded-xl border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Kuota Bawaan</span>
                      <span className="font-normal text-foreground">
                        {item.default_quota > 0 ? `${item.default_quota} hari / tahun` : 'Tanpa kuota'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Potong Kuota</span>
                      <span className="font-normal text-foreground">
                        {item.deduct_quota ? 'Ya (Potong)' : 'Tidak'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Batas Pengajuan</span>
                      <span className="font-normal text-foreground">
                        {item.min_notice_days > 0 ? `H-${item.min_notice_days} hari kerja` : 'Hari-H'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Syarat Lampiran</span>
                      <span className="font-normal text-foreground">
                        {item.requires_attachment ? 'Wajib Dokter' : 'Tidak'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="h-7.5 px-3 text-xs font-normal gap-1 cursor-pointer rounded-lg border border-border hover:bg-muted flex-1 sm:flex-none flex items-center justify-center transition-colors"
                    >
                      <Icon icon={Edit01Icon} size={13} className="text-muted-foreground" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center justify-center gap-1.5 h-7.5 px-3 rounded-lg text-xs font-normal border transition-colors cursor-pointer flex-1 sm:flex-none ${
                        item.is_active !== false
                          ? 'border-border text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                          : 'border-border text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
                      }`}
                    >
                      <span>{item.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTypes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>

      {/* Legal Reference & Guidelines Card - Matches Peraturan Denda Formula Box */}
      <Card className="p-5 rounded-2xl border border-border bg-muted/30 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-primary">
          <Icon icon={InformationCircleIcon} size={18} />
          <CardTitle className="text-sm font-semibold text-foreground">
            Pedoman Hukum & Kebijakan Jenis Cuti (UU No. 13/2003 & UU No. 6/2023)
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground font-normal">
          Ketentuan perundang-undangan ketenagakerjaan mengenai hak istirahat kerja dan pengupahan.
        </CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border bg-primary/10 text-primary border-primary/20">
              Cuti Tahunan (ANNUAL)
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Sekurang-kurangnya 12 hari kerja setelah 12 bulan bekerja terus menerus (Pasal 79 ayat 3).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25">
              Izin Sakit (SICK)
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Wajib surat keterangan dokter yang sah. Hak upah dibayar penuh dan tidak memotong kuota tahunan (Pasal 93).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25">
              Izin Khusus (SPECIAL)
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Menikah (3 hari), khitan/baptis anak (2 hari), keluarga inti wafat (2 hari), istri bersalin (2 hari).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border bg-muted text-muted-foreground border-border">
              Di Luar Tanggungan (UNPAID)
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cuti tanpa upah atas izin tertulis manajemen setelah saldo kuota cuti tahunan habis atau keperluan tertentu.
            </p>
          </div>
        </div>
      </Card>

      {/* Modal Dialog Tambah / Edit - Matches Peraturan Denda Form Dialog */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-type-modal-title"
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
                  <h3 id="leave-type-modal-title" className="text-sm font-bold text-foreground">
                    {editingType ? 'Edit Konfigurasi Jenis Cuti' : 'Tambah Jenis Cuti Baru'}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {editingType
                    ? `Perbarui kuota, kebijakan potongan, dan batas pengajuan untuk ${editingType.name}.`
                    : 'Daftarkan jenis cuti baru ke dalam database master sistem.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                aria-label="Tutup modal"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <Icon icon={AlertCircleIcon} size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="leave-type-form" onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Kode Unik Cuti <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={code}
                      disabled={Boolean(editingType)}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: ANNUAL, SICK"
                      className="font-mono text-xs uppercase h-8.5"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {editingType ? 'Kode unik master tidak dapat diubah.' : 'Gunakan huruf kapital tanpa spasi.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Nama Jenis Cuti <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Cuti Tahunan"
                      className="text-xs h-8.5"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Label yang tampil di form pengajuan karyawan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Kuota Bawaan (Hari / Tahun)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={defaultQuota}
                      onChange={(e) => setDefaultQuota(Number(e.target.value))}
                      className="text-xs h-8.5"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Isi 0 jika kuota tidak dibatasi per tahun.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground block">
                      Min. Pengajuan (Hari Kerja Sebelumnya)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={minNoticeDays}
                      onChange={(e) => setMinNoticeDays(Number(e.target.value))}
                      className="text-xs h-8.5"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Contoh: 3 untuk H-3. Isi 0 jika fleksibel Hari-H.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={deductQuota}
                      onChange={(e) => setDeductQuota(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-foreground font-medium block">
                        Memotong Kuota Tahunan Karyawan
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Pengambilan cuti ini akan mengurangi sisa saldo tahunan karyawan.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={requiresAttachment}
                      onChange={(e) => setRequiresAttachment(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-foreground font-medium block">
                        Wajibkan Lampiran / Surat Keterangan Dokter
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Karyawan wajib mengunggah file bukti sebelum pengajuan dapat diproses.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-foreground font-medium block">
                        Status Aktif
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Dapat dipilih oleh karyawan dalam formulir pengajuan cuti.
                      </span>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0 bg-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
                className="h-8 text-xs cursor-pointer font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="leave-type-form"
                size="sm"
                disabled={isSaving}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              >
                {isSaving ? 'Menyimpan...' : editingType ? 'Simpan Perubahan' : 'Buat Jenis Cuti'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

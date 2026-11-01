import React, { useEffect, useState, useMemo } from 'react'
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import { Skeleton } from '../ui/skeleton'
import { leaveService } from '../../services/api'
import type { LeaveBalance, LeaveRequest, LeaveType } from '../../types'

export const LeaveManagement: React.FC = () => {
  const [types, setTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Leave apply modal form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadLeaveTypes = async () => {
    try {
      const tRes = await leaveService.getTypes()
      if (tRes.data?.success && Array.isArray(tRes.data.data)) {
        setTypes(tRes.data.data)
      }
    } catch (err) {
      console.error('Gagal memuat daftar jenis cuti:', err)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      await loadLeaveTypes()

      try {
        const bRes = await leaveService.getBalances()
        if (bRes.data?.success && Array.isArray(bRes.data.data)) {
          setBalances(bRes.data.data)
        }
      } catch (err) {
        // Non-employee accounts may not have balances
      }

      try {
        const rRes = await leaveService.getMyLeaves()
        if (rRes.data?.success && Array.isArray(rRes.data.data)) {
          setRequests(rRes.data.data)
        }
      } catch (err) {
        // Non-employee accounts may not have request history
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedType = types.find((t) => t.id === Number(selectedTypeId))

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return requests.slice(start, start + pageSize)
  }, [requests, currentPage, pageSize])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedTypeId || !startDate || !endDate || !reason.trim()) {
      setFormError('Harap lengkapi semua isian formulir.')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Tanggal akhir cuti tidak boleh mendahului tanggal mulai.')
      return
    }

    if (selectedType?.min_notice_days && selectedType.min_notice_days > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const targetDate = new Date(startDate)
      targetDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < selectedType.min_notice_days) {
        setFormError(`Aturan Perusahaan: Pengajuan ${selectedType.name} wajib diajukan minimal H-${selectedType.min_notice_days} sebelum tanggal mulai.`)
        return
      }
    }

    if (selectedType?.requires_attachment) {
      if (!attachment) {
        setFormError('Pengajuan ini wajib melampirkan file surat dokter / bukti medis.')
        return
      }
      if (attachment.size > 1024 * 1024) {
        setFormError('Ukuran file lampiran maksimal 1 MB.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('leave_type_id', String(selectedTypeId))
      formData.append('start_date', startDate)
      formData.append('end_date', endDate)
      formData.append('reason', reason)
      if (attachment) {
        formData.append('attachment', attachment)
      }

      const res = await leaveService.applyLeave(formData)
      if (res.data?.success) {
        setSuccessMessage('Pengajuan cuti berhasil diajukan dan sedang menunggu persetujuan Line Manager!')
        setIsModalOpen(false)
        setSelectedTypeId('')
        setStartDate('')
        setEndDate('')
        setReason('')
        setAttachment(null)
        fetchData()
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal mengajukan permohonan cuti.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Manajemen Cuti & Izin Sakit</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Pengajuan permohonan waktu istirahat kerja dengan alur persetujuan berjenjang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFormError(null)
              loadLeaveTypes()
              setIsModalOpen(true)
            }}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Icon icon={PlusSignIcon} size={15} />
            <span>Ajukan Cuti</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between font-normal">
          <div className="flex items-center space-x-2">
            <Icon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-700 cursor-pointer">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}

      {/* Quota Balances Cards - Only displayed when balances exist */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {balances.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-muted/40 border border-border"
            >
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {b.leave_type?.name || 'Cuti Tahunan'} ({b.year})
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-semibold text-foreground">{b.remaining_quota}</span>
                  <span className="text-xs text-muted-foreground ml-1 font-normal">Hari Tersisa</span>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-normal">
                  <div>Total: {b.initial_quota}</div>
                  <div>Terpakai: {b.used_quota}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase text-muted-foreground/80">
              <th className="pb-2.5 px-3">No. Pengajuan</th>
              <th className="pb-2.5 px-3">Jenis Cuti</th>
              <th className="pb-2.5 px-3">Rentang Tanggal</th>
              <th className="pb-2.5 px-3">Durasi</th>
              <th className="pb-2.5 px-3">Bukti / Lampiran</th>
              <th className="pb-2.5 px-3">Alasan</th>
              <th className="pb-2.5 px-3">Tahap Persetujuan</th>
              <th className="pb-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3 px-3"><Skeleton className="h-5 w-16 rounded-md" /></td>
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Belum ada riwayat permohonan cuti.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 text-xs font-normal text-primary">
                    {r.request_number}
                  </td>
                  <td className="py-2.5 px-3 font-normal text-xs text-foreground">
                    {r.leave_type?.name || 'Cuti'}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">
                    {r.start_date} s/d {r.end_date}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">{r.total_days} Hari</td>
                  <td className="py-2.5 px-3 text-xs font-normal">
                    {r.attachment_url ? (
                      <a
                        href={r.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-primary hover:underline text-xs"
                      >
                        <Icon icon={File01Icon} size={14} />
                        <span>Lihat Dokumen</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-xs truncate font-normal">{r.reason}</td>
                  <td className="py-2.5 px-3 text-xs font-normal">
                    <span className="text-muted-foreground">
                      {r.current_step === 'manager' ? '1. Line Manager' : '2. HR Manager'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                        r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          : r.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                          : 'bg-secondary text-secondary-foreground border-secondary/40'
                      }`}
                    >
                      {r.status === 'approved'
                        ? 'Disetujui'
                        : r.status === 'rejected'
                        ? 'Ditolak'
                        : 'Menunggu'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={requests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        }}
      />

      {/* Modal Form Pengajuan Cuti */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-border relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
            >
              <Icon icon={Cancel01Icon} size={18} />
            </button>

            <h3 className="text-base font-semibold text-foreground mb-1">Form Pengajuan Cuti</h3>
            <p className="text-xs text-muted-foreground mb-5 font-normal">
              Isi formulir permohonan istirahat kerja Anda.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-secondary/20 border border-secondary/40 text-foreground text-xs flex items-start space-x-2 font-normal">
                <Icon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-normal text-muted-foreground uppercase">
                    Jenis Cuti / Izin <span className="text-rose-500">*</span>
                  </label>
                  {types.length > 0 && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {types.length} jenis cuti tersedia
                    </span>
                  )}
                </div>
                <select
                  required
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal cursor-pointer"
                >
                  <option value="">-- Pilih Jenis Cuti --</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) {t.default_quota > 0 ? `· Kuota ${t.default_quota} hari` : '· Khusus/Bebas'} {t.min_notice_days > 0 ? `· Min. H-${t.min_notice_days}` : ''}
                    </option>
                  ))}
                </select>

                {/* Selected Type Scheme & Rule Summary */}
                {selectedType && (
                  <div className="mt-2.5 p-3 rounded-xl bg-muted/30 border border-border/80 text-[11px] space-y-1.5 font-normal">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium text-foreground">{selectedType.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
                        {selectedType.code}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-[11px] pt-0.5">
                      <span className={selectedType.deduct_quota ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground'}>
                        • {selectedType.deduct_quota ? 'Memotong Kuota Tahunan' : 'Tidak Memotong Kuota'}
                      </span>
                      <span className="text-foreground">
                        • {selectedType.min_notice_days > 0 ? `Pengajuan Minimal H-${selectedType.min_notice_days} hari kerja` : 'Hari-H (Fleksibel)'}
                      </span>
                      {selectedType.requires_attachment && (
                        <span className="text-amber-700 dark:text-amber-300">
                          • Wajib Melampirkan Surat Dokter / Medis
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                  Alasan / Keterangan
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan keperluan cuti..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                />
              </div>

              {selectedType?.requires_attachment && (
                <div>
                  <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                    Unggah Bukti Surat Dokter (Maks 1 MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-normal file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-foreground font-normal text-xs hover:bg-muted/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

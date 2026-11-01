import React, { useEffect, useState, useMemo } from 'react'
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import { SkeletonBox } from '../ui/skeleton'
import { overtimeService } from '../../services/api'
import type { OvertimeRequest } from '../../types'

export const OvertimeManagement: React.FC = () => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Form states
  const [date, setDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('17:30')
  const [endTime, setEndTime] = useState<string>('20:00')
  const [durationHours, setDurationHours] = useState<number>(2.5)
  const [taskDescription, setTaskDescription] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleDurationChange = (newHours: number) => {
    setDurationHours(newHours)
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number)
      const totalMinutes = h * 60 + m + Math.round(newHours * 60)
      const endH = Math.floor(totalMinutes / 60) % 24
      const endM = totalMinutes % 60
      const formatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      setEndTime(formatted)
    }
  }

  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart)
    setEndTime(newEnd)
    if (newStart && newEnd) {
      const [sh, sm] = newStart.split(':').map(Number)
      const [eh, em] = newEnd.split(':').map(Number)
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm)
      if (diffMinutes < 0) diffMinutes += 24 * 60
      const hours = Math.min(4.0, Math.max(0.5, Math.round((diffMinutes / 60) * 2) / 2))
      setDurationHours(hours)
    }
  }

  const fetchOvertimes = async () => {
    setIsLoading(true)
    try {
      const res = await overtimeService.getMyOvertimes()
      if (res.data?.success) {
        setRequests(res.data.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOvertimes()
  }, [])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return requests.slice(start, start + pageSize)
  }, [requests, currentPage, pageSize])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!date || !startTime || !endTime || !taskDescription.trim()) {
      setFormError('Harap lengkapi semua isian formulir lembur.')
      return
    }

    if (durationHours <= 0 || durationHours > 4.0) {
      setFormError('Regulasi Depnaker: Durasi lembur maksimal 4.0 jam per hari kerja.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await overtimeService.applyOvertime({
        date,
        start_time: startTime,
        end_time: endTime,
        duration_hours: Number(durationHours),
        task_description: taskDescription,
      })

      if (res.data?.success) {
        setSuccessMessage('Pengajuan lembur berhasil diajukan dan sedang menunggu persetujuan Line Manager!')
        setIsModalOpen(false)
        setDate('')
        setTaskDescription('')
        fetchOvertimes()
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal mengajukan lembur.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Manajemen Lembur (Overtime)</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Pengajuan jam lembur kerja sesuai regulasi Depnaker (Maksimal 4 jam per hari).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          className="h-8.5 px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <Icon icon={PlusSignIcon} size={15} />
          <span>Ajukan Lembur</span>
        </button>
      </div>

      {successMessage && (
        <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between font-normal">
          <div className="flex items-center space-x-2">
            <Icon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-700">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}

      {/* Formula Upah Lembur & Legalitas K3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-4">
        {/* Card Formula */}
        <div className="md:col-span-7 p-4 rounded-xl bg-card border border-border shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-primary font-medium text-xs">
              <Icon icon={Clock01Icon} size={14} />
              <span className="uppercase tracking-wider">Formula Upah Lembur</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              PP No. 35/2021
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <div className="text-[10px] text-muted-foreground font-normal">Jam Pertama (Ke-1)</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">
                1.5× <span className="text-xs font-normal text-muted-foreground">Upah / Jam</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <div className="text-[10px] text-muted-foreground font-normal">Jam Berikutnya (Ke-2 s/d 4)</div>
              <div className="text-sm font-semibold text-primary mt-0.5">
                2.0× <span className="text-xs font-normal text-muted-foreground">Upah / Jam</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
            Tarif upah lembur per jam dihitung dengan standar Depnaker: <code className="font-semibold text-foreground">1/173 × Gaji Pokok Sebulan</code>.
          </p>
        </div>

        {/* Card Batas Legalitas */}
        <div className="md:col-span-5 p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
              <Icon icon={AlertCircleIcon} size={14} />
              <span className="uppercase tracking-wider">Batas Legalitas K3</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Maks. 4 Jam/Hari
            </span>
          </div>

          <div className="space-y-1 text-xs text-foreground font-normal">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Maksimal <strong>4.0 jam per hari</strong> kerja</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Maksimal <strong>18 jam per minggu</strong></span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
            Wajib melalui approval Line Manager & HR Manager sebelum masuk ke slip gaji.
          </p>
        </div>
      </div>

      {/* Requests Container (Desktop Table + Mobile Cards) */}
      <div className="my-4 rounded-xl border border-border/80 bg-card overflow-hidden">
        {isLoading ? (
          <div>
            {/* Desktop Table Skeleton */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[840px]">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                  <col className="w-[23%]" />
                  <col className="w-[18%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">No. Pengajuan</th>
                    <th className="py-2.5 px-3">Tanggal Lembur</th>
                    <th className="py-2.5 px-3">Jam Lembur</th>
                    <th className="py-2.5 px-2 text-center">Durasi</th>
                    <th className="py-2.5 px-3">Deskripsi Pekerjaan</th>
                    <th className="py-2.5 px-3">Tahap Persetujuan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="80%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="75%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="70%" radius={4} /></td>
                      <td className="py-2.5 px-2.5 align-middle text-center"><SkeletonBox height={18} width={48} radius={999} className="mx-auto" /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="90%" radius={4} /></td>
                      <td className="py-2.5 px-2.5 align-middle"><SkeletonBox height={14} width="75%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle text-center"><SkeletonBox height={20} width={64} radius={999} className="mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="block sm:hidden divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <SkeletonBox height={14} width="60%" radius={4} />
                      <SkeletonBox height={12} width="40%" radius={4} />
                    </div>
                    <SkeletonBox height={20} width={68} radius={6} className="shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={13} width="80%" radius={4} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={13} width="70%" radius={4} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <SkeletonBox height={10} width="35%" radius={3} />
                    <SkeletonBox height={12} width="90%" radius={4} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-muted/70 text-muted-foreground flex items-center justify-center">
                <Icon icon={Clock01Icon} size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Belum Ada Pengajuan Lembur</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto font-normal">
                  Pengajuan lembur yang telah Anda ajukan akan muncul di sini beserta persetujuannya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError(null)
                  setIsModalOpen(true)
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Icon icon={PlusSignIcon} size={14} />
                <span>Buat Pengajuan Lembur</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[840px]">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                  <col className="w-[23%]" />
                  <col className="w-[18%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">No. Pengajuan</th>
                    <th className="py-2.5 px-3">Tanggal Lembur</th>
                    <th className="py-2.5 px-3">Jam Lembur</th>
                    <th className="py-2.5 px-2 text-center">Durasi</th>
                    <th className="py-2.5 px-3">Deskripsi Pekerjaan</th>
                    <th className="py-2.5 px-3">Tahap Persetujuan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/25 transition-colors">
                      <td className="py-2.5 px-3 align-middle font-mono font-medium text-xs text-primary truncate" title={r.request_number}>
                        {r.request_number}
                      </td>
                      <td className="py-2.5 px-3 align-middle font-normal text-xs text-foreground whitespace-nowrap">{r.date}</td>
                      <td className="py-2.5 px-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                        {r.start_time} - {r.end_time}
                      </td>
                      <td className="py-2.5 px-2.5 align-middle text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-foreground font-medium text-[11px]">
                          {r.duration_hours} jam
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-xs text-muted-foreground truncate" title={r.task_description}>
                        {r.task_description}
                      </td>
                      <td className="py-2.5 px-2.5 align-middle text-xs whitespace-nowrap">
                        <span className="text-muted-foreground font-normal">
                          {r.current_step === 'manager' ? '1. Line Manager' : '2. HR Manager'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-border">
              {paginatedRequests.map((r) => (
                <div key={r.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium text-primary truncate">
                        {r.request_number}
                      </div>
                      <div className="font-semibold text-xs text-foreground mt-0.5">
                        {r.date}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border shrink-0 ${
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
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-medium">Jam Lembur</div>
                      <div className="text-xs text-foreground font-normal mt-0.5">
                        {r.start_time} - {r.end_time}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-medium">Durasi & Tahap</div>
                      <div className="text-xs text-foreground font-normal mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold">{r.duration_hours} jam</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.current_step === 'manager' ? 'Line Mgr' : 'HR Mgr'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Pekerjaan</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-2">
                      {r.task_description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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

      {/* Modal Form Overtime */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-border relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
            >
              <Icon icon={Cancel01Icon} size={18} />
            </button>

            <h3 className="text-base font-semibold text-foreground mb-1">Form Pengajuan Lembur</h3>
            <p className="text-xs text-muted-foreground mb-5 font-normal">
              Maksimal durasi lembur adalah 4 jam per hari kerja sesuai regulasi.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-secondary/20 border border-secondary/40 text-foreground text-xs flex items-start space-x-2 font-normal">
                <Icon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                  Tanggal Lembur
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => handleTimeChange(e.target.value, endTime)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => handleTimeChange(startTime, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                  Durasi Lembur (Pilih Jam)
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal cursor-pointer"
                >
                  <option value={0.5}>0.5 Jam (30 Menit)</option>
                  <option value={1.0}>1.0 Jam (60 Menit)</option>
                  <option value={1.5}>1.5 Jam (90 Menit)</option>
                  <option value={2.0}>2.0 Jam (120 Menit)</option>
                  <option value={2.5}>2.5 Jam (150 Menit)</option>
                  <option value={3.0}>3.0 Jam (180 Menit)</option>
                  <option value={3.5}>3.5 Jam (210 Menit)</option>
                  <option value={4.0}>4.0 Jam (Maksimal Depnaker)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                  Deskripsi Pekerjaan / Tugas Lembur
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Rincikan pekerjaan atau target yang diselesaikan..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                />
              </div>

              <div className="pt-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-foreground font-normal text-xs hover:bg-muted/50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
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

import React, { useEffect, useState } from 'react'
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { overtimeService } from '../../services/api'
import type { OvertimeRequest } from '../../types'

export const OvertimeManagement: React.FC = () => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Form states
  const [date, setDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('17:30')
  const [endTime, setEndTime] = useState<string>('20:00')
  const [durationHours, setDurationHours] = useState<number>(2.5)
  const [taskDescription, setTaskDescription] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
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

      {/* Overtime Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wide">Formula Upah Lembur Depnaker</div>
          <div className="text-xs font-normal text-foreground mt-1">
            Jam Pertama: 1.5x upah per jam • Jam Berikutnya: 2.0x upah per jam
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-secondary/20 border border-secondary/40">
          <div className="text-[11px] font-medium text-foreground uppercase tracking-wide">Batas Legalitas</div>
          <div className="text-xs font-normal text-foreground mt-1">
            Maksimal 4.0 jam per hari kerja untuk menjaga produktivitas & kesehatan karyawan
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase text-muted-foreground/80">
              <th className="pb-2.5 px-3">No. Pengajuan</th>
              <th className="pb-2.5 px-3">Tanggal Lembur</th>
              <th className="pb-2.5 px-3">Jam Lembur</th>
              <th className="pb-2.5 px-3">Durasi</th>
              <th className="pb-2.5 px-3">Deskripsi Pekerjaan</th>
              <th className="pb-2.5 px-3">Tahap Persetujuan</th>
              <th className="pb-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Memuat data lembur...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Belum ada pengajuan lembur.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 text-xs font-normal text-primary">
                    {r.request_number}
                  </td>
                  <td className="py-2.5 px-3 font-normal text-xs text-foreground">{r.date}</td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">
                    {r.start_time} - {r.end_time}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">{r.duration_hours} jam</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-xs truncate font-normal">{r.task_description}</td>
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
                    onChange={(e) => setStartTime(e.target.value)}
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
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase mb-1">
                  Durasi Lembur (Jam, Maksimal 4.0)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4.0"
                  required
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary font-normal"
                />
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
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
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

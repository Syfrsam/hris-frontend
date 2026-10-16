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
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Lembur (Overtime)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pengajuan jam lembur kerja sesuai regulasi Depnaker (Maksimal 4 jam per hari)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5"
        >
          <Icon icon={PlusSignIcon} size={18} />
          <span>Ajukan Lembur Baru</span>
        </button>
      </div>

      {successMessage && (
        <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon icon={CheckmarkCircle01Icon} size={20} className="text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <Icon icon={Cancel01Icon} size={18} />
          </button>
        </div>
      )}

      {/* Overtime Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="text-xs font-semibold text-indigo-700 uppercase">Formula Upah Lembur Depnaker</div>
          <div className="text-sm font-medium text-slate-800 mt-1">
            Jam Pertama: 1.5x upah per jam • Jam Berikutnya: 2.0x upah per jam
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
          <div className="text-xs font-semibold text-amber-700 uppercase">Batas Legalitas</div>
          <div className="text-sm font-medium text-slate-800 mt-1">
            Maksimal 4.0 jam per hari kerja untuk menjaga produktivitas & kesehatan karyawan
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 px-3">No. Pengajuan</th>
              <th className="pb-3 px-3">Tanggal Lembur</th>
              <th className="pb-3 px-3">Jam Lembur</th>
              <th className="pb-3 px-3">Durasi</th>
              <th className="pb-3 px-3">Deskripsi Pekerjaan</th>
              <th className="pb-3 px-3">Tahap Persetujuan</th>
              <th className="pb-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Memuat data lembur...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Belum ada pengajuan lembur.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-indigo-600">
                    {r.request_number}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">{r.date}</td>
                  <td className="py-3 px-3 font-mono text-xs">
                    {r.start_time} - {r.end_time}
                  </td>
                  <td className="py-3 px-3 text-xs font-bold">{r.duration_hours} jam</td>
                  <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate">{r.task_description}</td>
                  <td className="py-3 px-3 text-xs">
                    <span className="font-medium text-slate-700">
                      {r.current_step === 'manager' ? '1. Line Manager' : '2. HR Manager'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <Icon icon={Cancel01Icon} size={20} />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Form Pengajuan Lembur</h3>
            <p className="text-xs text-slate-500 mb-6">
              Maksimal durasi lembur adalah 4 jam per hari kerja sesuai regulasi.
            </p>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <Icon icon={AlertCircleIcon} size={16} className="flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Tanggal Lembur
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Deskripsi Pekerjaan / Tugas Lembur
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Rincikan pekerjaan atau target yang diselesaikan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
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

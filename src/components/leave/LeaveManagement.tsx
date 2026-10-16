import React, { useEffect, useState } from 'react'
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { leaveService } from '../../services/api'
import type { LeaveBalance, LeaveRequest, LeaveType } from '../../types'

export const LeaveManagement: React.FC = () => {
  const [types, setTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [tRes, bRes, rRes] = await Promise.all([
        leaveService.getTypes(),
        leaveService.getBalances(),
        leaveService.getMyLeaves(),
      ])
      if (tRes.data?.success) setTypes(tRes.data.data)
      if (bRes.data?.success) setBalances(bRes.data.data)
      if (rRes.data?.success) setRequests(rRes.data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedType = types.find((t) => t.id === Number(selectedTypeId))

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

    if (selectedType?.code === 'ANNUAL') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const targetDate = new Date(startDate)
      targetDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 3) {
        setFormError('Aturan Perusahaan: Pengajuan Cuti Tahunan wajib diajukan minimal H-3 sebelum tanggal cuti.')
        return
      }
    }

    if (selectedType?.requires_attachment) {
      if (!attachment) {
        setFormError('Izin Sakit wajib melampirkan file surat dokter / bukti medis.')
        return
      }
      if (attachment.size > 1024 * 1024) {
        setFormError('Ukuran file surat dokter maksimal 1 MB.')
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
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Cuti & Izin Sakit</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pengajuan permohonan waktu istirahat kerja dengan alur persetujuan berjenjang
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
          <span>Ajukan Cuti Baru</span>
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

      {/* Quota Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {balances.map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 shadow-sm"
          >
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              {b.leave_type?.name || 'Cuti Tahunan'} ({b.year})
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900">{b.remaining_quota}</span>
                <span className="text-xs text-slate-500 ml-1">Hari Tersisa</span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Total: {b.initial_quota}</div>
                <div>Terpakai: {b.used_quota}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 px-3">No. Pengajuan</th>
              <th className="pb-3 px-3">Jenis Cuti</th>
              <th className="pb-3 px-3">Rentang Tanggal</th>
              <th className="pb-3 px-3">Durasi</th>
              <th className="pb-3 px-3">Alasan</th>
              <th className="pb-3 px-3">Tahap Persetujuan</th>
              <th className="pb-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Memuat data pengajuan cuti...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Belum ada riwayat permohonan cuti.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-indigo-600">
                    {r.request_number}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">{r.leave_type?.name}</td>
                  <td className="py-3 px-3 text-xs">
                    {r.start_date} s/d {r.end_date}
                  </td>
                  <td className="py-3 px-3 text-xs font-bold">{r.total_days} hari</td>
                  <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate">{r.reason}</td>
                  <td className="py-3 px-3 text-xs">
                    <span className="inline-flex items-center space-x-1 font-medium text-slate-700">
                      <span>{r.current_step === 'manager' ? '1. Line Manager' : '2. HR Manager'}</span>
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

      {/* Modal Apply Leave */}
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

            <h3 className="text-xl font-bold text-slate-900 mb-1">Form Permohonan Cuti</h3>
            <p className="text-xs text-slate-500 mb-6">
              Sistem akan memvalidasi aturan H-3 (Cuti Tahunan) dan lampiran surat dokter (Izin Sakit).
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
                  Jenis Cuti / Izin
                </label>
                <select
                  required
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Jenis Cuti --</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.min_notice_days > 0 ? `(Minimal H-${t.min_notice_days})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Alasan / Keterangan
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan keperluan cuti..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {selectedType?.requires_attachment && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Unggah Bukti Surat Dokter (Maks 1 MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              )}

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

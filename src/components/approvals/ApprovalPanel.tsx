import React, { useEffect, useState } from 'react'
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { approvalService } from '../../services/api'
import type { LeaveRequest, OvertimeRequest } from '../../types'

export const ApprovalPanel: React.FC = () => {
  const { user } = useAuth()
  const [activeSubTab, setActiveSubTab] = useState<'leaves' | 'overtimes'>('leaves')
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [pendingOvertimes, setPendingOvertimes] = useState<OvertimeRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const isHr = user?.roles?.some((r) => ['HR Manager', 'Superadmin'].includes(r))

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [lRes, oRes] = await Promise.all([
        approvalService.getPendingLeaves(),
        approvalService.getPendingOvertimes(),
      ])
      if (lRes.data?.success) setPendingLeaves(lRes.data.data)
      if (oRes.data?.success) setPendingOvertimes(oRes.data.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApproveLeave = async (id: number) => {
    const notes = prompt('Catatan persetujuan (opsional):', 'Disetujui.')
    if (notes === null) return

    try {
      const res = await approvalService.approveLeave(id, notes)
      setStatusMessage(res.data?.message || 'Cuti berhasil disetujui!')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui cuti.')
    }
  }

  const handleRejectLeave = async (id: number) => {
    const notes = prompt('Alasan penolakan (wajib):')
    if (!notes || !notes.trim()) {
      alert('Alasan penolakan wajib diisi.')
      return
    }

    try {
      const res = await approvalService.rejectLeave(id, notes)
      setStatusMessage(res.data?.message || 'Cuti telah ditolak.')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menolak cuti.')
    }
  }

  const handleApproveOvertime = async (id: number) => {
    const notes = prompt('Catatan persetujuan lembur (opsional):', 'Disetujui.')
    if (notes === null) return

    try {
      const res = await approvalService.approveOvertime(id, notes)
      setStatusMessage(res.data?.message || 'Lembur berhasil disetujui!')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui lembur.')
    }
  }

  const handleRejectOvertime = async (id: number) => {
    const notes = prompt('Alasan penolakan lembur (wajib):')
    if (!notes || !notes.trim()) {
      alert('Alasan penolakan wajib diisi.')
      return
    }

    try {
      const res = await approvalService.rejectOvertime(id, notes)
      setStatusMessage(res.data?.message || 'Lembur telah ditolak.')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menolak lembur.')
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase mb-2">
            <span>Tahap Review: {isHr ? 'Tahap 2 (HR Manager)' : 'Tahap 1 (Line Manager)'}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Panel Persetujuan Permohonan Tim</h2>
          <p className="text-sm text-slate-500 mt-1">
            Verifikasi pengajuan cuti dan lembur karyawan bawahan dengan alur berjenjang
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'leaves'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cuti Menunggu ({pendingLeaves.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('overtimes')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'overtimes'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lembur Menunggu ({pendingOvertimes.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon icon={CheckmarkCircle01Icon} size={20} className="text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <Icon icon={Cancel01Icon} size={18} />
          </button>
        </div>
      )}

      {/* Leaves Approval Table */}
      {activeSubTab === 'leaves' && (
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="pb-3 px-3">No. Pengajuan</th>
                <th className="pb-3 px-3">Jenis Cuti</th>
                <th className="pb-3 px-3">Rentang Tanggal</th>
                <th className="pb-3 px-3">Hari</th>
                <th className="pb-3 px-3">Alasan</th>
                <th className="pb-3 px-3 text-right">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat permohonan cuti...
                  </td>
                </tr>
              ) : pendingLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada permohonan cuti yang menunggu persetujuan Anda saat ini.
                  </td>
                </tr>
              ) : (
                pendingLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-indigo-600">
                      {l.request_number}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{l.leave_type?.name}</td>
                    <td className="py-3.5 px-3 text-xs">
                      {l.start_date} s/d {l.end_date}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-bold">{l.total_days} hari</td>
                    <td className="py-3.5 px-3 text-xs text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(l.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
                      >
                        <Icon icon={Tick01Icon} size={15} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectLeave(l.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center space-x-1.5 border border-rose-200"
                      >
                        <Icon icon={Cancel01Icon} size={15} />
                        <span>Tolak</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Overtimes Approval Table */}
      {activeSubTab === 'overtimes' && (
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="pb-3 px-3">No. Pengajuan</th>
                <th className="pb-3 px-3">Tanggal Lembur</th>
                <th className="pb-3 px-3">Jam Kerja</th>
                <th className="pb-3 px-3">Durasi</th>
                <th className="pb-3 px-3">Tugas Lembur</th>
                <th className="pb-3 px-3 text-right">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat permohonan lembur...
                  </td>
                </tr>
              ) : pendingOvertimes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada permohonan lembur yang menunggu persetujuan Anda saat ini.
                  </td>
                </tr>
              ) : (
                pendingOvertimes.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-indigo-600">
                      {o.request_number}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{o.date}</td>
                    <td className="py-3.5 px-3 font-mono text-xs">
                      {o.start_time} - {o.end_time}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-bold">{o.duration_hours} jam</td>
                    <td className="py-3.5 px-3 text-xs text-slate-600 max-w-xs truncate">{o.task_description}</td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApproveOvertime(o.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
                      >
                        <Icon icon={Tick01Icon} size={15} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectOvertime(o.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center space-x-1.5 border border-rose-200"
                      >
                        <Icon icon={Cancel01Icon} size={15} />
                        <span>Tolak</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

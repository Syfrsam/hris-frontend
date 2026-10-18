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
    <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium uppercase mb-1">
            <span>Tahap Review: {isHr ? 'Tahap 2 (HR Manager)' : 'Tahap 1 (Line Manager)'}</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Panel Persetujuan Tim</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Verifikasi pengajuan cuti dan lembur karyawan bawahan dengan alur berjenjang.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex bg-muted p-1 rounded-lg text-xs font-normal">
          <button
            type="button"
            onClick={() => setActiveSubTab('leaves')}
            className={`px-3 py-1.5 rounded-md transition-all font-normal ${
              activeSubTab === 'leaves'
                ? 'bg-card text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cuti Menunggu ({pendingLeaves.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('overtimes')}
            className={`px-3 py-1.5 rounded-md transition-all font-normal ${
              activeSubTab === 'overtimes'
                ? 'bg-card text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lembur Menunggu ({pendingOvertimes.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="my-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-between font-normal">
          <div className="flex items-center space-x-2">
            <Icon icon={CheckmarkCircle01Icon} size={16} className="text-primary flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-primary hover:text-primary/80">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      )}

      {/* Leaves Approval Table */}
      {activeSubTab === 'leaves' && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-normal uppercase text-muted-foreground/80">
                <th className="pb-2.5 px-3">No. Pengajuan</th>
                <th className="pb-2.5 px-3">Jenis Cuti</th>
                <th className="pb-2.5 px-3">Rentang Tanggal</th>
                <th className="pb-2.5 px-3">Hari</th>
                <th className="pb-2.5 px-3">Alasan</th>
                <th className="pb-2.5 px-3 text-right">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                    Memuat permohonan cuti...
                  </td>
                </tr>
              ) : pendingLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                    Tidak ada permohonan cuti yang menunggu persetujuan saat ini.
                  </td>
                </tr>
              ) : (
                pendingLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 text-xs font-normal text-primary">
                      {l.request_number}
                    </td>
                    <td className="py-2.5 px-3 font-normal text-xs text-foreground">{l.leave_type?.name}</td>
                    <td className="py-2.5 px-3 text-xs font-normal text-muted-foreground">
                      {l.start_date} s/d {l.end_date}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-normal text-foreground">{l.total_days} hari</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-xs truncate font-normal">{l.reason}</td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveLeave(l.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <Icon icon={Tick01Icon} size={14} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectLeave(l.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-medium inline-flex items-center space-x-1 transition-colors"
                      >
                        <Icon icon={Cancel01Icon} size={14} />
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-normal uppercase text-muted-foreground/80">
                <th className="pb-2.5 px-3">No. Pengajuan</th>
                <th className="pb-2.5 px-3">Tanggal Lembur</th>
                <th className="pb-2.5 px-3">Jam Kerja</th>
                <th className="pb-2.5 px-3">Durasi</th>
                <th className="pb-2.5 px-3">Tugas Lembur</th>
                <th className="pb-2.5 px-3 text-right">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                    Memuat permohonan lembur...
                  </td>
                </tr>
              ) : pendingOvertimes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                    Tidak ada permohonan lembur yang menunggu persetujuan saat ini.
                  </td>
                </tr>
              ) : (
                pendingOvertimes.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 text-xs font-normal text-primary">
                      {o.request_number}
                    </td>
                    <td className="py-2.5 px-3 font-normal text-xs text-foreground">{o.date}</td>
                    <td className="py-2.5 px-3 text-xs font-normal text-foreground">
                      {o.start_time} - {o.end_time}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-normal text-foreground">{o.duration_hours} jam</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-xs truncate font-normal">{o.task_description}</td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveOvertime(o.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <Icon icon={Tick01Icon} size={14} />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectOvertime(o.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-medium inline-flex items-center space-x-1 transition-colors"
                      >
                        <Icon icon={Cancel01Icon} size={14} />
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

import React, { useEffect, useState } from 'react'
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { attendanceService } from '../../services/api'
import type { Attendance } from '../../types'

interface SummaryData {
  total_present?: number
  total_late?: number
  total_work_hours?: number
}

function formatClockTime(val: any): string {
  if (!val) return '-'
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val.time) return val.time
  return '-'
}

export const AttendanceHistory: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await attendanceService.getMyHistory(selectedMonth)
      if (res.data?.success) {
        const payload = res.data.data
        if (Array.isArray(payload)) {
          setAttendances(payload)
        } else if (payload?.records && Array.isArray(payload.records)) {
          setAttendances(payload.records)
          if (payload.summary) setSummary(payload.summary)
        } else {
          setAttendances([])
        }
      }
    } catch {
      setAttendances([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [selectedMonth])

  const safeList = Array.isArray(attendances) ? attendances : []
  const totalPresent = summary?.total_present ?? safeList.filter((a) => Boolean(formatClockTime(a.clock_in) !== '-')).length
  const totalLate = summary?.total_late ?? safeList.filter((a) => a.status === 'late').length
  const totalMinutes = safeList.reduce((acc, a) => acc + (a.work_duration_minutes || 0), 0)
  const totalHours = summary?.total_work_hours !== undefined 
    ? summary.total_work_hours.toFixed(1) 
    : (totalMinutes / 60).toFixed(1)

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Riwayat Presensi Bulanan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Rekap kehadiran, waktu clock-in & clock-out, serta kalkulasi keterlambatan
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Icon icon={Calendar03Icon} size={18} className="text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Recap Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase">Total Hadir</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{totalPresent} Hari</div>
          </div>
          <Icon icon={CheckmarkCircle01Icon} size={32} className="text-emerald-500 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase">Keterlambatan</div>
            <div className="text-2xl font-black text-amber-900 mt-1">{totalLate} Kali</div>
          </div>
          <Icon icon={Clock01Icon} size={32} className="text-amber-500 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-700 uppercase">Jam Kerja Efektif</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{totalHours} Jam</div>
          </div>
          <Icon icon={Clock01Icon} size={32} className="text-indigo-500 opacity-80" />
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 px-3">Tanggal</th>
              <th className="pb-3 px-3">Clock-In</th>
              <th className="pb-3 px-3">Clock-Out</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Keterlambatan</th>
              <th className="pb-3 px-3 text-right">Durasi Kerja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Memuat data riwayat...
                </td>
              </tr>
            ) : safeList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Belum ada catatan presensi pada bulan ini.
                </td>
              </tr>
            ) : (
              safeList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-900">{item.date}</td>
                  <td className="py-3 px-3 font-mono text-xs">{formatClockTime(item.clock_in)}</td>
                  <td className="py-3 px-3 font-mono text-xs">{formatClockTime(item.clock_out)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status === 'present'
                        ? 'Tepat Waktu'
                        : item.status === 'late'
                        ? 'Terlambat'
                        : 'Alpa'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {item.late_minutes > 0 ? (
                      <span className="text-amber-700 font-semibold">{item.late_minutes} menit</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                    {item.work_duration_minutes > 0
                      ? `${(item.work_duration_minutes / 60).toFixed(1)} jam`
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

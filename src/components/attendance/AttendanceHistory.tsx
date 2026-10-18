import React, { useEffect, useState } from 'react'
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { attendanceService } from '../../services/api'
import type { Attendance } from '../../types'
import { Badge } from '../ui/badge'

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
    <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-xs mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Riwayat Presensi</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">Rekapitulasi kehadiran bulanan</p>
        </div>

        <div className="flex items-center space-x-2">
          <Icon icon={Calendar03Icon} size={16} className="text-muted-foreground" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-normal text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Recap Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Hadir</div>
            <div className="text-lg font-semibold text-foreground mt-0.5">{totalPresent} Hari</div>
          </div>
          <Icon icon={CheckmarkCircle01Icon} size={24} className="text-emerald-500 opacity-90" />
        </div>

        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Keterlambatan</div>
            <div className="text-lg font-semibold text-foreground mt-0.5">{totalLate} Kali</div>
          </div>
          <Icon icon={Clock01Icon} size={24} className="text-rose-500 opacity-90" />
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Jam Kerja Efektif</div>
            <div className="text-lg font-semibold text-foreground mt-0.5">{totalHours} Jam</div>
          </div>
          <Icon icon={Clock01Icon} size={24} className="text-muted-foreground opacity-80" />
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase text-muted-foreground/80">
              <th className="pb-2.5 px-3">Tanggal</th>
              <th className="pb-2.5 px-3">Clock-In</th>
              <th className="pb-2.5 px-3">Clock-Out</th>
              <th className="pb-2.5 px-3">Status</th>
              <th className="pb-2.5 px-3">Keterlambatan</th>
              <th className="pb-2.5 px-3 text-right">Durasi Kerja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Memuat data...
                </td>
              </tr>
            ) : safeList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Tidak ada catatan presensi pada periode ini.
                </td>
              </tr>
            ) : (
              safeList.map((item) => (
                <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 font-normal text-xs text-foreground">{item.date}</td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">{formatClockTime(item.clock_in)}</td>
                  <td className="py-2.5 px-3 text-xs font-normal text-foreground">{formatClockTime(item.clock_out)}</td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={
                        item.status === 'present'
                          ? 'success'
                          : item.status === 'late'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="text-[10px] px-2 py-0.5 font-medium"
                    >
                      {item.status === 'present'
                        ? 'Tepat Waktu'
                        : item.status === 'late'
                        ? 'Terlambat'
                        : 'Alpa'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    {item.late_minutes > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">{item.late_minutes}m</span>
                    ) : (
                      <span className="text-muted-foreground font-normal">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs font-normal text-foreground">
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

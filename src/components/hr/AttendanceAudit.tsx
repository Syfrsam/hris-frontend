import React, { useState, useEffect, useMemo } from 'react'
import {
  AlertCircleIcon,
  Clock01Icon,
  Calendar03Icon,
  Location01Icon,
  CheckmarkCircle01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import api from '../../services/api'
import type { Attendance, ClockDetails } from '../../types'

export const AttendanceAudit: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [anomalies, setAnomalies] = useState<Attendance[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')

  const fetchAnomalies = async (date: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/attendances/anomalies?date=${date}`)
      const data = res.data?.data || []
      setAnomalies(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching anomalies:', err)
      setAnomalies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnomalies(selectedDate)
  }, [selectedDate])

  const getClockTimeString = (clock: ClockDetails | string | null | undefined): string => {
    if (!clock) return '-'
    if (typeof clock === 'object' && clock !== null) {
      return clock.time || '-'
    }
    return String(clock)
  }

  const getDistanceMeters = (clock: ClockDetails | string | null | undefined): number | null => {
    if (clock && typeof clock === 'object' && typeof clock.distance_meters === 'number') {
      return clock.distance_meters
    }
    return null
  }

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      const name = a.employee?.user?.name?.toLowerCase() || ''
      const nik = a.employee?.nik?.toLowerCase() || ''
      const q = search.toLowerCase()
      return name.includes(q) || nik.includes(q)
    })
  }, [anomalies, search])

  const summary = useMemo(() => {
    const total = anomalies.length
    const late = anomalies.filter((a) => (a.late_minutes || 0) > 0).length
    const noClockOut = anomalies.filter((a) => a.clock_in && !a.clock_out).length
    const totalLateMinutes = anomalies.reduce((acc, curr) => acc + (curr.late_minutes || 0), 0)
    return { total, late, noClockOut, totalLateMinutes }
  }, [anomalies])

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-primary font-normal text-xs uppercase tracking-wider mb-1">
            <Icon icon={AlertCircleIcon} size={15} />
            <span>Audit & Compliance HR</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Audit Anomali Presensi Harian
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Pemeriksaan keterlambatan toleransi shift dan ketidaksesuaian absensi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-muted border border-border rounded-lg px-2.5 py-1.5 space-x-2 text-xs text-foreground">
            <Icon icon={Calendar03Icon} size={15} className="text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none font-normal text-foreground text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchAnomalies(selectedDate)}
            className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Segarkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border shadow-xs ${
          summary.total > 0
            ? 'bg-rose-500/10 border-rose-500/20'
            : 'bg-card border-border'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider ${
            summary.total > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
          }`}>
            Total Anomali
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.total}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Kasus tercatat</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-secondary/40 bg-secondary/20 shadow-xs">
          <div className="text-[11px] font-medium text-foreground uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={Clock01Icon} size={13} />
            <span>Terlambat</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.late}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">&gt; 15 menit shift</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Tanpa Clock-Out
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.noClockOut}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Belum scan pulang</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border bg-muted/40 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Menit Telat
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.totalLateMinutes} <span className="text-xs font-normal text-muted-foreground">menit</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Terpotong di payroll</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Icon icon={Search01Icon} size={15} />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal"
            />
          </div>
          <span className="text-xs font-normal text-muted-foreground">
            {filtered.length} Kasus
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2 font-normal">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Menganalisis data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={CheckmarkCircle01Icon} size={22} className="text-emerald-500" />
            <span className="text-sm font-medium text-foreground">
              Tidak Ada Anomali Kehadiran
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Semua karyawan pada tanggal ini mematuhi jadwal shift dan radius GPS kantor.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Karyawan</th>
                  <th className="py-2.5 px-4">Shift Kerja</th>
                  <th className="py-2.5 px-4">Waktu Masuk</th>
                  <th className="py-2.5 px-4">Keterlambatan</th>
                  <th className="py-2.5 px-4">Radius GPS</th>
                  <th className="py-2.5 px-4">Konsekuensi Payroll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const clockInStr = getClockTimeString(item.clock_in)
                  const distance = getDistanceMeters(item.clock_in)
                  const lateMinutes = item.late_minutes || 0

                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-medium text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {((item as any).employee_name || item.employee?.user?.name || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-normal text-foreground text-xs">
                              {(item as any).employee_name || item.employee?.user?.name || 'Karyawan'}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-normal">
                              NIK: {(item as any).nik || item.employee?.nik || '-'} • {(item.employee?.department?.name || 'Divisi')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-normal text-foreground text-xs">
                          {item.shift?.name || 'Shift Reguler'}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {item.shift?.start_time} - {item.shift?.end_time}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-normal text-foreground text-xs">
                        {clockInStr}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25">
                          <Icon icon={AlertCircleIcon} size={12} />
                          <span>+{lateMinutes} Menit</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {distance !== null ? (
                          <span className={`inline-flex items-center space-x-1 text-xs font-normal ${
                            distance <= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            <Icon icon={Location01Icon} size={12} />
                            <span>{distance}m {distance <= 100 ? '(Aman)' : '(Luar Radius)'}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-normal">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[11px] font-normal text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                          Dipotong Rp 25.000/jam
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

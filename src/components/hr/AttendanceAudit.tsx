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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Icon icon={AlertCircleIcon} size={16} />
            <span>Audit & Compliance HR</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Audit Anomali Presensi Harian
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pemeriksaan pelanggaran disiplin kerja: keterlambatan melebihi 15 menit toleransi dan ketidaksesuaian clock-in/out.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 space-x-2 text-sm text-slate-700 shadow-inner">
            <Icon icon={Calendar03Icon} size={18} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchAnomalies(selectedDate)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-2xl text-sm transition-all border border-indigo-200/50"
          >
            Segarkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Anomali
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {summary.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">Pelanggaran tercatat hari ini</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={Clock01Icon} size={14} />
            <span>Karyawan Terlambat</span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {summary.late}
          </div>
          <div className="text-xs text-amber-700/80 mt-1">&gt; 15 menit toleransi shift</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Tanpa Clock-Out
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-2">
            {summary.noClockOut}
          </div>
          <div className="text-xs text-indigo-700/80 mt-1">Belum scan pulang kerja</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Total Menit Telat
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {summary.totalLateMinutes} <span className="text-sm font-semibold text-slate-400">menit</span>
          </div>
          <div className="text-xs text-rose-500 mt-1">Otomatis terpotong di payroll</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon icon={Search01Icon} size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIK karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            {filtered.length} Kasus Terdeteksi
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Menganalisis anomali kehadiran...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100">
              <Icon icon={CheckmarkCircle01Icon} size={24} />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Tidak Ada Anomali Kehadiran
            </span>
            <span className="text-xs text-slate-400 max-w-sm">
              Semua karyawan pada tanggal ini mematuhi jadwal shift dan radius geofence kantor dengan sempurna.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Karyawan</th>
                  <th className="py-3.5 px-6">Shift Kerja</th>
                  <th className="py-3.5 px-6">Waktu Masuk</th>
                  <th className="py-3.5 px-6">Keterlambatan</th>
                  <th className="py-3.5 px-6">Radius GPS</th>
                  <th className="py-3.5 px-6">Konsekuensi Payroll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const clockInStr = getClockTimeString(item.clock_in)
                  const distance = getDistanceMeters(item.clock_in)
                  const lateMinutes = item.late_minutes || 0

                  return (
                    <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 border border-rose-200/60">
                            {((item as any).employee_name || item.employee?.user?.name || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {(item as any).employee_name || item.employee?.user?.name || 'Karyawan'}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              NIK: {(item as any).nik || item.employee?.nik || '-'} • {(item.employee?.department?.name || 'Divisi')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-xs">
                          {item.shift?.name || 'Shift Reguler'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.shift?.start_time} - {item.shift?.end_time}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-rose-600 text-xs">
                        {clockInStr}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <Icon icon={AlertCircleIcon} size={13} />
                          <span>+{lateMinutes} Menit</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {distance !== null ? (
                          <span className="inline-flex items-center space-x-1 text-xs text-slate-600 font-mono">
                            <Icon icon={Location01Icon} size={13} className="text-slate-400" />
                            <span>{distance}m</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
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

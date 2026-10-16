import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock01Icon,
  Calendar03Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  UserGroupIcon,
  Location01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import api from '../../services/api'
import type { Attendance, ClockDetails } from '../../types'

export const TeamAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [records, setRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchTeamAttendance = async (date: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/attendances/team?date=${date}`)
      const data = res.data?.data || []
      setRecords(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load team attendance:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamAttendance(selectedDate)
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

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length
    const late = records.filter((r) => r.status === 'late').length
    const absent = records.filter((r) => r.status === 'absent' || !r.clock_in).length
    return { total, present, late, absent }
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const name = r.employee?.user?.name?.toLowerCase() || ''
      const nik = r.employee?.nik?.toLowerCase() || ''
      const query = search.toLowerCase()
      const matchesSearch = name.includes(query) || nik.includes(query)

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'present'
          ? r.status === 'present'
          : statusFilter === 'late'
          ? r.status === 'late'
          : r.status === 'absent' || !r.clock_in

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Icon icon={UserGroupIcon} size={16} />
            <span>Portal Manajer Divisi</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Kehadiran Tim
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau real-time presensi, jam masuk, dan verifikasi radius GPS kantor untuk seluruh anggota tim Anda.
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
            onClick={() => fetchTeamAttendance(selectedDate)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-2xl text-sm transition-all border border-indigo-200/50"
          >
            Segarkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Tim
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {summary.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">Anggota bawahan aktif</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={CheckmarkCircle01Icon} size={14} />
            <span>Tepat Waktu</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {summary.present}
          </div>
          <div className="text-xs text-emerald-700/80 mt-1">Masuk sebelum batas toleransi</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={AlertCircleIcon} size={14} />
            <span>Terlambat</span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {summary.late}
          </div>
          <div className="text-xs text-amber-700/80 mt-1">&gt; 15 menit toleransi</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">
            Belum Presensi
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {summary.absent}
          </div>
          <div className="text-xs text-rose-600/80 mt-1">Tidak ada rekaman clock-in</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon icon={Search01Icon} size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIK anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'present', label: 'Tepat Waktu' },
              { id: 'late', label: 'Terlambat' },
              { id: 'absent', label: 'Belum Hadir' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === btn.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat presensi tim...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
              <Icon icon={UserGroupIcon} size={24} />
            </div>
            <span className="text-sm font-bold text-slate-700">
              Tidak Ada Rekaman Kehadiran
            </span>
            <span className="text-xs text-slate-400 max-w-sm">
              Tidak ada data anggota tim yang cocok dengan filter atau tanggal yang dipilih.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Karyawan</th>
                  <th className="py-3.5 px-6">Jabatan & Divisi</th>
                  <th className="py-3.5 px-6">Jam Masuk</th>
                  <th className="py-3.5 px-6">Jam Pulang</th>
                  <th className="py-3.5 px-6">Verifikasi GPS</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => {
                  const clockInStr = getClockTimeString(item.clock_in)
                  const clockOutStr = getClockTimeString(item.clock_out)
                  const distance = getDistanceMeters(item.clock_in)
                  const isPresent = item.status === 'present'
                  const isLate = item.status === 'late'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/60">
                            {((item as any).employee_name || item.employee?.user?.name || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {(item as any).employee_name || item.employee?.user?.name || 'Karyawan'}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              NIK: {(item as any).nik || item.employee?.nik || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-xs">
                          {item.employee?.job_position?.title || 'Staff'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.employee?.department?.name || 'Departemen'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-slate-800 text-xs">
                        {clockInStr !== '-' ? (
                          <span className="flex items-center space-x-1.5">
                            <Icon icon={Clock01Icon} size={14} className="text-emerald-500" />
                            <span>{clockInStr}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-slate-800 text-xs">
                        {clockOutStr !== '-' ? (
                          <span className="flex items-center space-x-1.5">
                            <Icon icon={Clock01Icon} size={14} className="text-indigo-500" />
                            <span>{clockOutStr}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {distance !== null ? (
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              distance <= 100
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            }`}
                          >
                            <Icon icon={Location01Icon} size={13} />
                            <span>{distance}m dari Kantor</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isPresent ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <Icon icon={CheckmarkCircle01Icon} size={13} />
                            <span>Tepat Waktu</span>
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Icon icon={AlertCircleIcon} size={13} />
                            <span>Terlambat ({item.late_minutes}m)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            <span>Belum Hadir</span>
                          </span>
                        )}
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

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
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-primary font-normal text-xs uppercase tracking-wider mb-1">
            <Icon icon={UserGroupIcon} size={15} />
            <span>Portal Manajer Divisi</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Monitoring Kehadiran Tim
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Presensi real-time dan verifikasi radius GPS kantor untuk anggota tim.
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
            onClick={() => fetchTeamAttendance(selectedDate)}
            className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Segarkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Tim
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.total}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Anggota aktif</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={CheckmarkCircle01Icon} size={13} />
            <span>Tepat Waktu</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.present}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Sesuai shift</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-secondary/40 bg-secondary/20 shadow-xs">
          <div className="text-[11px] font-medium text-foreground uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={AlertCircleIcon} size={13} />
            <span>Terlambat</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.late}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">&gt; 15m toleransi</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 shadow-xs">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Belum Presensi
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.absent}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Tanpa rekaman</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Icon icon={Search01Icon} size={15} />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NIK anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal"
            />
          </div>

          <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
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
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === btn.id
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-normal">Memuat data...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={UserGroupIcon} size={22} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tidak Ada Data Kehadiran</span>
            <span className="text-xs text-muted-foreground">Tidak ada anggota yang cocok dengan filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Karyawan</th>
                  <th className="py-2.5 px-4">Jabatan</th>
                  <th className="py-2.5 px-4">Jam Masuk</th>
                  <th className="py-2.5 px-4">Jam Pulang</th>
                  <th className="py-2.5 px-4">Verifikasi GPS</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((item) => {
                  const clockInStr = getClockTimeString(item.clock_in)
                  const clockOutStr = getClockTimeString(item.clock_out)
                  const distance = getDistanceMeters(item.clock_in)
                  const isPresent = item.status === 'present'
                  const isLate = item.status === 'late'

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
                              NIK: {(item as any).nik || item.employee?.nik || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-normal text-foreground text-xs">
                          {item.employee?.job_position?.title || 'Staff'}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {item.employee?.department?.name || 'Departemen'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-normal text-foreground text-xs">
                        {clockInStr !== '-' ? (
                          <span className="flex items-center space-x-1">
                            <Icon icon={Clock01Icon} size={13} className="text-primary" />
                            <span>{clockInStr}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-normal text-foreground text-xs">
                        {clockOutStr !== '-' ? (
                          <span className="flex items-center space-x-1">
                            <Icon icon={Clock01Icon} size={13} className="text-primary" />
                            <span>{clockOutStr}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {distance !== null ? (
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                              distance <= 100
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                            }`}
                          >
                            <Icon icon={Location01Icon} size={12} />
                            <span>{distance}m {distance <= 100 ? '(Dalam Radius)' : '(Luar Radius)'}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-normal">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                            <Icon icon={CheckmarkCircle01Icon} size={12} />
                            <span>Tepat Waktu</span>
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-secondary text-secondary-foreground border-secondary/40">
                            <Icon icon={AlertCircleIcon} size={12} />
                            <span>Terlambat ({item.late_minutes}m)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25">
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

import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock01Icon,
  Calendar03Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  UserGroupIcon,
  Location01Icon,
  Camera01Icon,
  Cancel01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Avatar } from '../common/Avatar'
import { Pagination } from '../common/Pagination'
import api from '../../services/api'
import type { Attendance, ClockDetails } from '../../types'

export const TeamAttendance: React.FC = () => {
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10')
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-30')
  const [records, setRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const fetchTeamAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (viewMode === 'monthly') {
        params.append('month', selectedMonth)
      } else {
        params.append('date', selectedDate)
      }

      const res = await api.get(`/attendances/team?${params.toString()}`)
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
    fetchTeamAttendance()
  }, [viewMode, selectedMonth, selectedDate])

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

  const formatDateIndo = (dateStr?: string): string => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter((r) => r.status === 'on_time' || r.status === 'present').length
    const late = records.filter((r) => r.status === 'late').length
    const absent = records.filter((r) => r.status === 'absent' || !r.clock_in).length
    return { total, present, late, absent }
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const name = ((r as any).employee_name || r.employee?.user?.name || '').toLowerCase()
      const nik = ((r as any).nik || r.employee?.nik || '').toLowerCase()
      const query = search.toLowerCase()
      const matchesSearch = name.includes(query) || nik.includes(query)

      const isPresent = r.status === 'on_time' || r.status === 'present'
      const isLate = r.status === 'late'
      const isAbsent = r.status === 'absent' || !r.clock_in

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'present'
          ? isPresent
          : statusFilter === 'late'
          ? isLate
          : isAbsent

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter])

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, selectedMonth, selectedDate, viewMode])

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center space-x-1.5 text-primary font-normal text-xs uppercase tracking-wider mb-1">
              <Icon icon={UserGroupIcon} size={15} />
              <span>Presensi & Monitoring Tim</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Riwayat Kehadiran Tim
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">
              Pantau rekapitulasi kehadiran seluruh anggota tim, jam kerja, foto selfie, dan verifikasi radius GPS.
            </p>
          </div>

          {/* View Mode Toggle & Date Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
            {/* Mode Switcher */}
            <div className="inline-flex items-center bg-muted p-1 rounded-xl border border-border text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-lg font-normal transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-card text-foreground shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Riwayat Bulanan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded-lg font-normal transition-all cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-card text-foreground shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Harian
              </button>
            </div>

            {/* Date / Month Picker */}
            {viewMode === 'monthly' ? (
              <div className="inline-flex items-center bg-muted border border-border rounded-xl px-2.5 py-1 space-x-1.5 text-xs text-foreground shrink-0">
                <Icon icon={Calendar03Icon} size={14} className="text-muted-foreground" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent focus:outline-none font-normal text-foreground text-xs cursor-pointer"
                />
              </div>
            ) : (
              <div className="inline-flex items-center bg-muted border border-border rounded-xl px-2.5 py-1 space-x-1.5 text-xs text-foreground shrink-0">
                <Icon icon={Calendar03Icon} size={14} className="text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent focus:outline-none font-normal text-foreground text-xs cursor-pointer"
                />
              </div>
            )}

            <button
              type="button"
              onClick={fetchTeamAttendance}
              title="Segarkan data presensi"
              className="h-8 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-normal rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Icon icon={RefreshIcon} size={13} className={loading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Rekaman
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.total}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
            {viewMode === 'monthly' ? 'Akumulasi presensi bulan ini' : 'Kehadiran hari ini'}
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
            <Icon icon={CheckmarkCircle01Icon} size={13} />
            <span>Tepat Waktu</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.present}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Sesuai shift kerja</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 shadow-xs">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
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
            Belum Hadir / Alpha
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {summary.absent}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Tanpa rekaman presensi</div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Icon icon={Search01Icon} size={15} />
            </div>
            <input
              type="text"
              placeholder="Cari nama karyawan atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-8.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-normal"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Hapus pencarian"
              >
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center flex-wrap gap-1 bg-muted p-1 rounded-xl border border-border text-xs shrink-0">
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
                className={`px-3 py-1 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-card text-foreground shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance Records Table */}
        {loading ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-normal">Memuat rekaman presensi tim...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={UserGroupIcon} size={24} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tidak Ada Data Presensi</span>
            <span className="text-xs text-muted-foreground">
              Belum ada riwayat kehadiran pada filter periode yang dipilih.
            </span>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[23%]" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal & Shift</th>
                    <th className="py-2.5 px-3">Karyawan</th>
                    <th className="py-2.5 px-3">Jabatan & Divisi</th>
                    <th className="py-2.5 px-3">Presensi (Masuk / Pulang)</th>
                    <th className="py-2.5 px-3 text-right sm:text-left">Status & Radius GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedRecords.map((item) => {
                    const clockInStr = getClockTimeString(item.clock_in)
                    const clockOutStr = getClockTimeString(item.clock_out)
                    const distance = getDistanceMeters(item.clock_in)
                    const isPresent = item.status === 'on_time' || item.status === 'present'
                    const isLate = item.status === 'late'
                    const isEarly = item.status === 'early_leave'
                    const clockInPhoto =
                      typeof item.clock_in === 'object' && item.clock_in !== null
                        ? item.clock_in.photo_url || null
                        : null

                    return (
                      <tr key={item.id} className="hover:bg-muted/25 transition-colors">
                        {/* Tanggal & Shift */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="font-medium text-foreground truncate block">
                            {formatDateIndo(item.date)}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate block">
                            {item.shift?.name || 'Regular Shift'}
                          </div>
                        </td>

                        {/* Karyawan */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Avatar
                              src={item.employee?.user?.avatar_url}
                              name={(item as any).employee_name || item.employee?.user?.name}
                              size="sm"
                              className="shrink-0"
                            />
                            <div className="min-w-0 overflow-hidden">
                              <div className="font-normal text-foreground text-xs truncate block" title={(item as any).employee_name || item.employee?.user?.name}>
                                {(item as any).employee_name || item.employee?.user?.name || 'Karyawan'}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-normal truncate block">
                                NIK: {(item as any).nik || item.employee?.nik || '-'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Jabatan & Divisi */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-normal text-foreground text-xs truncate block" title={item.employee?.job_position?.title || 'Staff'}>
                              {item.employee?.job_position?.title || 'Staff'}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-normal truncate block" title={(item as any).department || item.employee?.department?.name || 'Departemen'}>
                              {(item as any).department || item.employee?.department?.name || 'Departemen'}
                            </div>
                          </div>
                        </td>

                        {/* Presensi Masuk / Pulang */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[10px] text-muted-foreground w-11 shrink-0">Masuk:</span>
                              {clockInStr !== '-' ? (
                                <span className="inline-flex items-center gap-1 font-mono text-xs">
                                  <Icon icon={Clock01Icon} size={12} className="text-primary" />
                                  <span>{clockInStr}</span>
                                  {clockInPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhotoUrl(clockInPhoto)}
                                      className="p-0.5 rounded hover:bg-muted text-primary cursor-pointer transition-colors"
                                      title="Lihat foto selfie presensi"
                                    >
                                      <img
                                        src={clockInPhoto}
                                        alt="Selfie"
                                        className="w-4.5 h-4.5 rounded object-cover border border-primary/30"
                                      />
                                    </button>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[10px] text-muted-foreground w-11 shrink-0">Pulang:</span>
                              {clockOutStr !== '-' ? (
                                <span className="inline-flex items-center gap-1 font-mono text-xs">
                                  <Icon icon={Clock01Icon} size={12} className="text-muted-foreground" />
                                  <span>{clockOutStr}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status & Radius GPS */}
                        <td className="py-2.5 px-3 align-middle overflow-hidden">
                          <div className="space-y-1 min-w-0">
                            <div>
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                                  <Icon icon={CheckmarkCircle01Icon} size={11} />
                                  <span>Tepat Waktu</span>
                                </span>
                              ) : isLate ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
                                  <Icon icon={AlertCircleIcon} size={11} />
                                  <span>Terlambat ({item.late_minutes}m)</span>
                                </span>
                              ) : isEarly ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25">
                                  <span>Pulang Cepat</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25">
                                  <span>Belum Hadir</span>
                                </span>
                              )}
                            </div>
                            <div>
                              {distance !== null ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-medium border ${
                                    distance <= 100
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                  }`}
                                >
                                  <Icon icon={Location01Icon} size={10} />
                                  <span>
                                    {Math.round(distance)}m {distance <= 100 ? '(Valid)' : '(Luar)'}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="sm:hidden divide-y divide-border/60 bg-card">
              {paginatedRecords.map((item) => {
                const clockInStr = getClockTimeString(item.clock_in)
                const clockOutStr = getClockTimeString(item.clock_out)
                const distance = getDistanceMeters(item.clock_in)
                const isPresent = item.status === 'on_time' || item.status === 'present'
                const isLate = item.status === 'late'
                const isEarly = item.status === 'early_leave'
                const clockInPhoto =
                  typeof item.clock_in === 'object' && item.clock_in !== null
                    ? item.clock_in.photo_url || null
                    : null

                return (
                  <div key={item.id} className="p-3.5 space-y-2.5">
                    {/* Header: Date + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-xs text-foreground block">
                          {formatDateIndo(item.date)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.shift?.name || 'Regular Shift'}
                        </span>
                      </div>

                      {isPresent ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shrink-0">
                          <Icon icon={CheckmarkCircle01Icon} size={11} />
                          <span>Tepat Waktu</span>
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shrink-0">
                          <Icon icon={AlertCircleIcon} size={11} />
                          <span>Terlambat ({item.late_minutes}m)</span>
                        </span>
                      ) : isEarly ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 shrink-0">
                          <span>Pulang Cepat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shrink-0">
                          <span>Belum Hadir</span>
                        </span>
                      )}
                    </div>

                    {/* Employee Profile */}
                    <div className="flex items-center space-x-2.5">
                      <Avatar
                        src={item.employee?.user?.avatar_url}
                        name={(item as any).employee_name || item.employee?.user?.name}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-normal text-foreground text-xs truncate">
                          {(item as any).employee_name || item.employee?.user?.name || 'Karyawan'}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {item.employee?.job_position?.title || 'Staff'} · {(item as any).department || item.employee?.department?.name || 'Departemen'} (NIK: {(item as any).nik || item.employee?.nik || '-'})
                        </div>
                      </div>
                    </div>

                    {/* Presensi Details Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60 text-[11px]">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Jam Masuk</span>
                        <div className="flex items-center space-x-1 font-mono font-medium text-foreground mt-0.5">
                          <span>{clockInStr}</span>
                          {clockInPhoto && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(clockInPhoto)}
                              className="p-0.5 text-primary"
                              title="Lihat selfie"
                            >
                              <Icon icon={Camera01Icon} size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground block">Jam Pulang</span>
                        <span className="font-mono font-medium text-foreground mt-0.5 block">
                          {clockOutStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground block">Radius GPS</span>
                        <span className="text-[10px] mt-0.5 block font-medium">
                          {distance !== null ? `${Math.round(distance)}m ${distance <= 100 ? '(Valid)' : '(Luar)'}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </div>

      {/* Selfie Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Icon icon={Camera01Icon} size={16} className="text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Verifikasi Foto Selfie</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-square flex items-center justify-center">
              <img src={previewPhotoUrl} alt="Selfie Presensi" className="w-full h-full object-contain" />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

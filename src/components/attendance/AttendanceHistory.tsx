import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar03Icon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import { attendanceService } from '../../services/api'
import type { Attendance } from '../../types'
import { Badge } from '../ui/badge'
import { SkeletonBox } from '../ui/skeleton'

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
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

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
    setCurrentPage(1)
  }, [selectedMonth])

  const safeList = Array.isArray(attendances) ? attendances : []
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return safeList.slice(start, start + pageSize)
  }, [safeList, currentPage, pageSize])

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
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <SkeletonBox height={11} width="55%" radius={3} />
                <SkeletonBox height={22} width="40%" radius={4} />
              </div>
              <SkeletonBox height={28} width={28} radius={8} />
            </div>
          ))}
        </div>
      ) : (
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
      )}

      {/* History Container (Desktop Table + Mobile Cards) */}
      <div className="my-4 rounded-xl border border-border/80 bg-card overflow-hidden">
        {isLoading ? (
          <div>
            {/* Desktop Table Skeleton */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[740px]">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Clock-In</th>
                    <th className="py-2.5 px-3">Clock-Out</th>
                    <th className="py-2.5 px-3">Bukti Foto</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Keterlambatan</th>
                    <th className="py-2.5 px-3 text-right">Durasi Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="75%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="60%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="60%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={28} width={28} radius={6} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={20} width={70} radius={999} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="65%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle text-right"><SkeletonBox height={14} width="50%" radius={4} className="ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="block sm:hidden divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <SkeletonBox height={14} width="40%" radius={4} />
                    <SkeletonBox height={20} width={68} radius={6} className="shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={13} width="70%" radius={4} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={13} width="70%" radius={4} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <SkeletonBox height={12} width="45%" radius={3} />
                    <SkeletonBox height={12} width="35%" radius={3} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : safeList.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-muted/70 text-muted-foreground flex items-center justify-center">
                <Icon icon={Clock01Icon} size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Tidak Ada Catatan Presensi</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto font-normal">
                  Catatan clock-in dan clock-out pada rentang periode ini belum tersedia.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[740px]">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Clock-In</th>
                    <th className="py-2.5 px-3">Clock-Out</th>
                    <th className="py-2.5 px-3">Bukti Foto</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Keterlambatan</th>
                    <th className="py-2.5 px-3 text-right">Durasi Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedList.map((item) => {
                    const photoUrl = typeof item.clock_in === 'object' ? item.clock_in?.photo_url : null
                    return (
                      <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3 font-normal text-xs text-foreground">{item.date}</td>
                        <td className="py-2.5 px-3 text-xs font-normal text-foreground">{formatClockTime(item.clock_in)}</td>
                        <td className="py-2.5 px-3 text-xs font-normal text-foreground">{formatClockTime(item.clock_out)}</td>
                        <td className="py-2.5 px-3">
                          {photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(photoUrl)}
                              className="inline-flex items-center space-x-1.5 p-0.5 rounded-lg hover:bg-muted text-primary cursor-pointer transition-colors"
                              title="Lihat foto selfie presensi"
                            >
                              <img
                                src={photoUrl}
                                alt="Selfie"
                                className="w-7 h-7 rounded-md object-cover border border-primary/20"
                              />
                              <span className="text-[11px] font-medium underline">Selfie</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs font-normal">-</span>
                          )}
                        </td>
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
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-border">
              {paginatedList.map((item) => {
                const photoUrl = typeof item.clock_in === 'object' ? item.clock_in?.photo_url : null
                return (
                  <div key={item.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-foreground">
                        {item.date}
                      </div>
                      <Badge
                        variant={
                          item.status === 'present'
                            ? 'success'
                            : item.status === 'late'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px] px-2 py-0.5 font-medium shrink-0"
                      >
                        {item.status === 'present'
                          ? 'Tepat Waktu'
                          : item.status === 'late'
                          ? 'Terlambat'
                          : 'Alpa'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Clock-In & Out</div>
                        <div className="text-xs text-foreground font-normal mt-0.5">
                          {formatClockTime(item.clock_in)} s/d {formatClockTime(item.clock_out)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Durasi Kerja</div>
                        <div className="text-xs text-foreground font-normal mt-0.5">
                          {item.work_duration_minutes > 0
                            ? `${(item.work_duration_minutes / 60).toFixed(1)} jam`
                            : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center space-x-1.5 text-muted-foreground">
                        <span>Keterlambatan:</span>
                        {item.late_minutes > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            {item.late_minutes} menit
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0 menit</span>
                        )}
                      </div>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(photoUrl)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-muted text-primary hover:bg-muted/80 text-[11px] font-medium cursor-pointer"
                        >
                          <Icon icon={Camera01Icon} size={12} />
                          <span>Foto Selfie</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={safeList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 31]}
      />

      {/* Selfie Photo Preview Modal */}
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
                className="text-muted-foreground hover:text-foreground p-1"
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
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs"
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

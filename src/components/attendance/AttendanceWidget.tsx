import React, { useEffect, useState } from 'react'
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  CompassIcon,
  Location01Icon,
  Login01Icon,
  Logout01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { attendanceService, branchService } from '../../services/api'
import type { Attendance, Branch } from '../../types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

const DEFAULT_LAT = -6.225014
const DEFAULT_LNG = 106.809657
const DEFAULT_RADIUS = 100

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function getClockTimeString(clock: any): string {
  if (!clock) return ''
  if (typeof clock === 'string') return clock
  if (typeof clock === 'object' && clock.time) return clock.time
  return ''
}

export const AttendanceWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)

  const officeLat = activeBranch ? Number(activeBranch.latitude) : DEFAULT_LAT
  const officeLng = activeBranch ? Number(activeBranch.longitude) : DEFAULT_LNG
  const maxRadius = activeBranch ? Number(activeBranch.radius_meters) : DEFAULT_RADIUS

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation tidak didukung browser.')
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserCoords({ lat, lng })
        const dist = calculateDistanceMeters(lat, lng, officeLat, officeLng)
        setDistance(dist)
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        setGeoError(err.code === err.PERMISSION_DENIED ? 'Akses GPS ditolak.' : 'Gagal membaca GPS.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [todayRes, branchRes] = await Promise.all([
        attendanceService.getToday().catch(() => null),
        branchService.getBranches().catch(() => null),
      ])

      if (todayRes?.data?.success) {
        setAttendance(todayRes.data.data)
      }
      if (branchRes?.data?.success && branchRes.data.data.length > 0) {
        setActiveBranch(branchRes.data.data[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    detectLocation()
  }, [])

  useEffect(() => {
    if (userCoords) {
      const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, officeLat, officeLng)
      setDistance(dist)
    }
  }, [officeLat, officeLng])

  const handleClockIn = async () => {
    if (!userCoords) {
      setActionMessage({ text: 'GPS belum aktif.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setActionMessage(null)
    try {
      const res = await attendanceService.clockIn({
        latitude: userCoords.lat,
        longitude: userCoords.lng,
      })
      if (res.data?.success) {
        setAttendance(res.data.data)
        setActionMessage({ text: 'Clock-in berhasil!', type: 'success' })
      }
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Gagal clock-in.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClockOut = async () => {
    if (!userCoords) {
      setActionMessage({ text: 'GPS belum aktif.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setActionMessage(null)
    try {
      const res = await attendanceService.clockOut({
        latitude: userCoords.lat,
        longitude: userCoords.lng,
      })
      if (res.data?.success) {
        setAttendance(res.data.data)
        setActionMessage({ text: 'Clock-out berhasil!', type: 'success' })
      }
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Gagal clock-out.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const simulateHqLocation = () => {
    setUserCoords({ lat: officeLat, lng: officeLng })
    setDistance(0)
    setGeoError(null)
    setActionMessage({
      text: `Lokasi disimulasikan di ${activeBranch?.name || 'Kantor Pusat'}.`,
      type: 'success',
    })
  }

  const isWithinRadius = distance !== null && distance <= maxRadius

  const clockInDisplay = getClockTimeString(attendance?.clock_in)
  const clockOutDisplay = getClockTimeString(attendance?.clock_out)
  const hasClockedIn = Boolean(clockInDisplay)
  const hasClockedOut = Boolean(clockOutDisplay)

  return (
    <Card className="rounded-2xl p-5 lg:p-6 mb-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Presensi Karyawan</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">{currentDate}</p>
        </div>

        {/* Live Digital Clock */}
        <div className="bg-brand-dark text-white px-3.5 py-1.5 rounded-xl flex items-center space-x-3 shadow-xs border border-brand-dark/20 w-fit">
          <div className="w-2 h-2 rounded-sm bg-emerald-400 animate-pulse" />
          <div className="text-right">
            <div className="text-[9px] text-white/60 tracking-wider leading-none font-normal">WAKTU SISTEM</div>
            <div className="text-base font-semibold tracking-wider leading-tight mt-0.5">{currentTime || '08:00:00'}</div>
          </div>
        </div>
      </div>

      {/* Geolocation Status Bar */}
      <div className="my-4 p-3 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg border ${
            isWithinRadius
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
          }`}>
            <Icon icon={Location01Icon} size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-xs text-foreground">
                {activeBranch?.name || 'Jakarta Head Office'}
              </span>
              {distance !== null && (
                <Badge variant={isWithinRadius ? 'success' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {isWithinRadius ? 'Dalam Radius' : `Di Luar Radius (Maks. ${maxRadius}m)`}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              {distance !== null ? `Jarak: ${distance} m` : isLocating ? 'Mencari sinyal GPS...' : 'GPS belum terbaca'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={isLocating}
            className="rounded-lg text-xs h-8 font-normal"
          >
            <Icon icon={RefreshIcon} size={13} className={isLocating ? 'animate-spin' : ''} />
            <span>{isLocating ? 'Cek...' : 'Cek GPS'}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={simulateHqLocation}
            className="rounded-lg text-xs h-8 font-medium"
          >
            <Icon icon={CompassIcon} size={13} />
            <span>Simulasi (0m)</span>
          </Button>
        </div>
      </div>

      {geoError && (
        <div className="mb-4 p-2.5 rounded-lg bg-secondary/20 border border-secondary/40 text-foreground text-xs flex items-center space-x-2 font-normal">
          <Icon icon={AlertCircleIcon} size={14} className="shrink-0 text-foreground" />
          <span>{geoError} Gunakan &quot;Simulasi (0m)&quot; untuk uji absensi.</span>
        </div>
      )}

      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs flex items-center space-x-2 border ${
            actionMessage.type === 'success'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted text-foreground border-border'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <Icon icon={CheckmarkCircle01Icon} size={16} className="shrink-0 text-primary" />
          ) : (
            <Icon icon={AlertCircleIcon} size={16} className="shrink-0 text-muted-foreground" />
          )}
          <span className="font-normal">{actionMessage.text}</span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wide">Jadwal Shift</div>
          <div className="text-sm font-semibold text-foreground mt-1">08:30 - 17:30 WIB</div>
        </div>

        <div className="p-3.5 rounded-xl bg-secondary/25 border border-secondary/40">
          <div className="text-[11px] font-medium text-foreground/80 uppercase tracking-wide">Toleransi</div>
          <div className="text-sm font-semibold text-foreground mt-1">15 Menit (s/d 08:45)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status Hari Ini</div>
          <div className="mt-1">
            {hasClockedIn ? (
              <Badge variant={attendance?.status === 'late' ? 'warning' : 'success'} className="text-xs">
                {attendance?.status === 'late'
                  ? `Terlambat (${attendance.late_minutes}m)`
                  : 'Tepat Waktu'}
              </Badge>
            ) : (
              <span className="text-xs font-normal text-muted-foreground">Belum Hadir</span>
            )}
          </div>
        </div>
      </div>

      {/* Clock-In Bar: Timer + Note + Action */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-center gap-2.5">
        <div className="px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-foreground tracking-wide shrink-0">
          {currentTime || '08:30:00'}
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan masuk (opsional)..."
          className="flex-1 w-full bg-transparent border-0 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-normal"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            type="button"
            onClick={handleClockIn}
            disabled={hasClockedIn || !isWithinRadius || isSubmitting || isLoading}
            className="w-full sm:w-auto h-9 px-4 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 text-xs"
          >
            <Icon icon={Login01Icon} size={15} />
            <span>
              {hasClockedIn ? `Masuk: ${clockInDisplay}` : 'Clock-In'}
            </span>
          </Button>

          {hasClockedIn && !hasClockedOut && (
            <Button
              type="button"
              variant="brandDark"
              onClick={handleClockOut}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 px-4 rounded-lg font-semibold shadow-xs text-xs"
            >
              <Icon icon={Logout01Icon} size={15} />
              <span>Clock-Out</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

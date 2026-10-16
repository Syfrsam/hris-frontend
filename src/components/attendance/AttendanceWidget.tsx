import React, { useEffect, useState } from 'react'
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  CompassIcon,
  Location01Icon,
  Login01Icon,
  Logout01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { attendanceService } from '../../services/api'
import type { Attendance } from '../../types'

const HQ_LAT = -6.225014
const HQ_LNG = 106.809657
const MAX_RADIUS_METERS = 100

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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)

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
      setGeoError('Browser Anda tidak mendukung deteksi lokasi Geolocation.')
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserCoords({ lat, lng })
        const dist = calculateDistanceMeters(lat, lng, HQ_LAT, HQ_LNG)
        setDistance(dist)
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Izin akses lokasi GPS ditolak. Harap izinkan akses lokasi di browser.')
        } else {
          setGeoError('Gagal mendeteksi lokasi GPS: ' + err.message)
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const fetchTodayAttendance = async () => {
    setIsLoading(true)
    try {
      const res = await attendanceService.getToday()
      if (res.data?.success) {
        setAttendance(res.data.data)
      }
    } catch {
      // not clocked-in yet
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
    detectLocation()
  }, [])

  const handleClockIn = async () => {
    if (!userCoords) {
      setActionMessage({ text: 'Lokasi GPS belum terdeteksi. Silakan klik tombol perbarui lokasi.', type: 'error' })
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
        setActionMessage({ text: res.data.message || 'Clock-in berhasil!', type: 'success' })
      }
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Gagal melakukan clock-in.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClockOut = async () => {
    if (!userCoords) {
      setActionMessage({ text: 'Lokasi GPS belum terdeteksi.', type: 'error' })
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
        setActionMessage({ text: res.data.message || 'Clock-out berhasil!', type: 'success' })
      }
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Gagal melakukan clock-out.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const simulateHqLocation = () => {
    setUserCoords({ lat: HQ_LAT, lng: HQ_LNG })
    setDistance(0)
    setGeoError(null)
    setActionMessage({ text: 'Lokasi disimulasikan tepat di Kantor Pusat (HQ Jakarta).', type: 'success' })
  }

  const isWithinRadius = distance !== null && distance <= MAX_RADIUS_METERS

  const clockInDisplay = getClockTimeString(attendance?.clock_in)
  const clockOutDisplay = getClockTimeString(attendance?.clock_out)
  const hasClockedIn = Boolean(clockInDisplay)
  const hasClockedOut = Boolean(clockOutDisplay)

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide">
            <Icon icon={Clock01Icon} size={15} />
            <span>Presensi Harian & Geofencing GPS</span>
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">Pencatatan Kehadiran Karyawan</h2>
          <p className="text-sm text-slate-500">{currentDate}</p>
        </div>

        {/* Live Digital Clock */}
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center space-x-3 shadow-md">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs text-slate-400 font-mono">WAKTU SERVER (WIB)</div>
            <div className="text-2xl font-black font-mono tracking-wider">{currentTime || '08:00:00'}</div>
          </div>
        </div>
      </div>

      {/* Geolocation Status Card */}
      <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded-xl ${isWithinRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Icon icon={Location01Icon} size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-slate-900">
                  Kantor Cabang: Jakarta Head Office (JKT-HQ)
                </span>
                {distance !== null && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      isWithinRadius
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isWithinRadius ? '✓ Dalam Radius' : '✕ Di Luar Radius'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {distance !== null
                  ? `Jarak Anda saat ini: ${distance} meter dari titik kantor (Batas maksimal: 100 meter)`
                  : isLocating
                  ? 'Sedang mendeteksi sinyal GPS presisi...'
                  : 'Menunggu pembacaan GPS...'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Icon icon={RefreshIcon} size={14} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Mencari...' : 'Cek GPS'}</span>
            </button>
            <button
              type="button"
              onClick={simulateHqLocation}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 flex items-center space-x-1.5 transition-all"
              title="Gunakan titik koordinat kantor agar tombol Clock-in aktif"
            >
              <Icon icon={CompassIcon} size={15} />
              <span>Simulasi di Kantor (0m)</span>
            </button>
          </div>
        </div>

        {geoError && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <Icon icon={AlertCircleIcon} size={16} className="flex-shrink-0" />
            <span>{geoError} — Kamu bisa klik tombol &quot;Simulasi di Kantor&quot; untuk langsung menguji presensi.</span>
          </div>
        )}
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm flex items-start space-x-2 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <Icon icon={CheckmarkCircle01Icon} size={18} className="flex-shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <Icon icon={AlertCircleIcon} size={18} className="flex-shrink-0 text-rose-600 mt-0.5" />
          )}
          <span className="font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Shift & Tolerance Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="text-xs font-semibold text-indigo-600 uppercase">Jadwal Shift</div>
          <div className="text-lg font-bold text-slate-900 mt-1">08:30 - 17:30 WIB</div>
          <div className="text-xs text-slate-500 mt-0.5">Shift Reguler Senin - Jumat</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
          <div className="text-xs font-semibold text-amber-600 uppercase">Toleransi Keterlambatan</div>
          <div className="text-lg font-bold text-slate-900 mt-1">15 Menit (s/d 08:45)</div>
          <div className="text-xs text-slate-500 mt-0.5">Lewat 08:45 otomatis berstatus Late</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-600 uppercase">Status Hari Ini</div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {hasClockedIn ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                attendance?.status === 'late'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {attendance?.status === 'late'
                  ? `Terlambat (${attendance.late_minutes} menit)`
                  : 'Tepat Waktu'}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500">Belum Melakukan Clock-in</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {hasClockedOut ? 'Sudah Clock-out' : hasClockedIn ? 'Sedang Bekerja' : 'Menunggu Kehadiran'}
          </div>
        </div>
      </div>

      {/* Main Clock-In / Clock-Out Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleClockIn}
          disabled={hasClockedIn || !isWithinRadius || isSubmitting || isLoading}
          className={`p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 font-bold transition-all shadow-lg ${
            hasClockedIn
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : !isWithinRadius
              ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <Icon icon={Login01Icon} size={28} />
          <span className="text-lg">
            {hasClockedIn ? `Masuk: ${clockInDisplay}` : 'Presensi Masuk (Clock-In)'}
          </span>
          <span className="text-xs font-normal opacity-90">
            {hasClockedIn
              ? 'Clock-in hari ini telah tercatat'
              : !isWithinRadius
              ? 'Harus berada dalam radius 100m'
              : 'Klik untuk merekam kehadiran'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleClockOut}
          disabled={!hasClockedIn || hasClockedOut || isSubmitting}
          className={`p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 font-bold transition-all shadow-lg ${
            !hasClockedIn || hasClockedOut
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <Icon icon={Logout01Icon} size={28} />
          <span className="text-lg">
            {hasClockedOut ? `Pulang: ${clockOutDisplay}` : 'Presensi Pulang (Clock-Out)'}
          </span>
          <span className="text-xs font-normal opacity-90">
            {hasClockedOut
              ? 'Jam kerja hari ini selesai'
              : !hasClockedIn
              ? 'Lakukan clock-in terlebih dahulu'
              : 'Klik untuk mengakhiri shift'}
          </span>
        </button>
      </div>
    </div>
  )
}

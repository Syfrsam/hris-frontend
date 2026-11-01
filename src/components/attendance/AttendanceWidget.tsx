import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertCircleIcon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  CompassIcon,
  Location01Icon,
  Login01Icon,
  Logout01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { attendanceService, branchService, shiftService } from '../../services/api'
import type { Attendance, Branch, Shift } from '../../types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { SkeletonBox } from '../ui/skeleton'

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
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Selfie states
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  // Direct In-App Live Camera States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false)
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Geolocation & Map States
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [showMap, setShowMap] = useState<boolean>(true)

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const officeMarkerRef = useRef<L.Marker | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const geofenceCircleRef = useRef<L.Circle | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)

  const officeLat = activeBranch ? Number(activeBranch.latitude) : DEFAULT_LAT
  const officeLng = activeBranch ? Number(activeBranch.longitude) : DEFAULT_LNG
  const maxRadius = activeBranch ? Number(activeBranch.radius_meters) : DEFAULT_RADIUS
  const isWithinRadius = distance !== null && distance <= maxRadius

  // Real-time digital clock
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

  // Geolocation detection
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation tidak didukung oleh peramban ini.')
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
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Akses GPS ditolak. Harap izinkan akses lokasi di peramban.'
            : 'Gagal membaca sinyal GPS dari perangkat Anda.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Load attendance, branch & shift data
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [todayRes, branchRes, shiftRes] = await Promise.all([
        attendanceService.getToday().catch(() => null),
        branchService.getBranches().catch(() => null),
        shiftService.getShifts().catch(() => null),
      ])

      if (todayRes?.data?.success) {
        setAttendance(todayRes.data.data)
      }
      if (branchRes?.data?.success && branchRes.data.data.length > 0) {
        setActiveBranch(branchRes.data.data[0])
      }
      if (shiftRes?.data?.success && shiftRes.data.data?.length > 0) {
        const found = shiftRes.data.data.find((s: Shift) => s.is_active) || shiftRes.data.data[0]
        setActiveShift(found)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    detectLocation()
  }, [])

  // Recalculate distance when coords change
  useEffect(() => {
    if (userCoords) {
      const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, officeLat, officeLng)
      setDistance(dist)
    }
  }, [officeLat, officeLng, userCoords])

  // --- LEAFLET MAP INITIALIZATION & UPDATE ---
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [officeLat, officeLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Office custom pin
      const officeIcon = L.divIcon({
        className: 'office-map-pin',
        html: `
          <div style="
            background-color: #1358D0;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(19, 88, 208, 0.45);
            border: 2px solid #ffffff;
          ">
            <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const officeMarker = L.marker([officeLat, officeLng], { icon: officeIcon }).addTo(map)
      officeMarker.bindPopup(`<b>${activeBranch?.name || 'Kantor Cabang'}</b><br>Batas radius: ${maxRadius} meter`)
      officeMarkerRef.current = officeMarker

      // Geofence circle
      const circleColor = isWithinRadius ? '#10B981' : '#F43F5E'
      const geofenceCircle = L.circle([officeLat, officeLng], {
        radius: maxRadius,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map)
      geofenceCircleRef.current = geofenceCircle

      mapInstanceRef.current = map
    } else {
      // Update office & circle if activeBranch changes
      if (officeMarkerRef.current) {
        officeMarkerRef.current.setLatLng([officeLat, officeLng])
        officeMarkerRef.current.setPopupContent(`<b>${activeBranch?.name || 'Kantor Cabang'}</b><br>Batas radius: ${maxRadius} meter`)
      }
      if (geofenceCircleRef.current) {
        const circleColor = isWithinRadius ? '#10B981' : '#F43F5E'
        geofenceCircleRef.current.setLatLng([officeLat, officeLng])
        geofenceCircleRef.current.setRadius(maxRadius)
        geofenceCircleRef.current.setStyle({ color: circleColor, fillColor: circleColor })
      }
    }

    // Update user marker and polyline if userCoords exist
    const map = mapInstanceRef.current
    if (map && userCoords) {
      const userIcon = L.divIcon({
        className: 'user-map-pin',
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      if (!userMarkerRef.current) {
        const uMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map)
        uMarker.bindPopup(`<b>Posisi Anda Saat Ini</b><br>Jarak: ${distance !== null ? distance + ' m' : '-'}`)
        userMarkerRef.current = uMarker
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng])
        userMarkerRef.current.setPopupContent(`<b>Posisi Anda Saat Ini</b><br>Jarak: ${distance !== null ? distance + ' m' : '-'}`)
      }

      // Draw polyline connecting user to office
      const linePoints: [number, number][] = [
        [userCoords.lat, userCoords.lng],
        [officeLat, officeLng],
      ]
      if (!polylineRef.current) {
        const polyline = L.polyline(linePoints, {
          color: isWithinRadius ? '#10B981' : '#F43F5E',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.8,
        }).addTo(map)
        polylineRef.current = polyline
      } else {
        polylineRef.current.setLatLngs(linePoints)
        polylineRef.current.setStyle({
          color: isWithinRadius ? '#10B981' : '#F43F5E',
        })
      }

      // Fit bounds to show both office and user
      const group = L.featureGroup([officeMarkerRef.current!, userMarkerRef.current])
      map.fitBounds(group.getBounds().pad(0.35))
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // ignore
        }
        mapInstanceRef.current = null
        officeMarkerRef.current = null
        userMarkerRef.current = null
        polylineRef.current = null
        geofenceCircleRef.current = null
      }
    }
  }, [showMap, officeLat, officeLng, maxRadius, userCoords, isWithinRadius, distance, activeBranch])

  // Center map on user
  const centerOnUser = () => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 17, { animate: true })
    }
  }

  // Center map on office
  const centerOnOffice = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([officeLat, officeLng], 17, { animate: true })
    }
  }

  // --- DIRECT LIVE CAMERA WEBRTC IMPLEMENTATION ---
  const startLiveCamera = async (mode: 'user' | 'environment' = 'user') => {
    setIsCameraOpen(true)
    setIsCameraStarting(true)
    setCameraError(null)
    setCapturedSnapshot(null)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Peramban Anda tidak mendukung akses kamera langsung.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      })

      streamRef.current = stream
      setFacingMode(mode)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Harap izinkan kamera pada pengaturan peramban Anda.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat webcam / kamera tidak ditemukan pada komputer/HP Anda.')
      } else {
        setCameraError(err.message || 'Gagal menyalakan kamera langsung.')
      }
    } finally {
      setIsCameraStarting(false)
    }
  }

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
    setCapturedSnapshot(null)
  }

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    startLiveCamera(nextMode)
  }

  const captureLivePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    // Trigger visual flash animation
    setFlashAnimation(true)
    setTimeout(() => setFlashAnimation(false), 300)

    const canvas = document.createElement('canvas')
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sx = ((video.videoWidth || 640) - size) / 2
    const sy = ((video.videoHeight || 640) - size) / 2

    // Un-mirror if facing user
    if (facingMode === 'user') {
      ctx.translate(size, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
    }

    // Security Watermark (Anti-Manipulation Guarantee)
    const nowStr = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB'
    const coordsStr = userCoords
      ? `GPS: ${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)} (${distance !== null ? distance + 'm' : ''})`
      : 'GPS: ' + (activeBranch?.name || 'Kantor')
    const branchName = activeBranch?.name || 'HRIS Cloud'

    // Semi-transparent bottom banner for timestamp & security stamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, size - 48, size, 48)

    ctx.fillStyle = '#10B981'
    ctx.beginPath()
    ctx.arc(16, size - 28, 4, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px Inter, system-ui, sans-serif'
    ctx.fillText(`VERIFIED LIVE SELFIE • ${branchName}`, 26, size - 24)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.fillText(`${nowStr} • ${coordsStr}`, 26, size - 10)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedSnapshot(dataUrl)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setSelfieFile(file)
          setSelfiePreview(dataUrl)
        }
      },
      'image/jpeg',
      0.92
    )
  }

  const confirmCapturedPhoto = () => {
    stopLiveCamera()
  }

  const retakeCapturedPhoto = () => {
    setCapturedSnapshot(null)
    setSelfieFile(null)
    setSelfiePreview(null)
    if (streamRef.current && videoRef.current) {
      videoRef.current.play()
    } else {
      startLiveCamera(facingMode)
    }
  }

  // --- CLOCK IN & CLOCK OUT HANDLERS ---
  const handleClockIn = async () => {
    if (!userCoords) {
      setActionMessage({ text: 'GPS belum aktif. Harap aktifkan sinyal lokasi.', type: 'error' })
      return
    }

    if (!selfieFile) {
      setActionMessage({
        text: 'Wajib mengambil foto selfie biometrik langsung sebelum Clock-In.',
        type: 'error',
      })
      startLiveCamera()
      return
    }

    setIsSubmitting(true)
    setActionMessage(null)
    try {
      const res = await attendanceService.clockIn({
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        photo: selfieFile,
      })
      if (res.data?.success) {
        setAttendance(res.data.data)
        setSelfieFile(null)
        setSelfiePreview(null)
        setActionMessage({
          text: 'Clock-in berhasil! Foto selfie telah tersimpan aman di Cloudinary CDN.',
          type: 'success',
        })
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
        photo: selfieFile || undefined,
      })
      if (res.data?.success) {
        setAttendance(res.data.data)
        setSelfieFile(null)
        setSelfiePreview(null)
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

  const clockInDisplay = getClockTimeString(attendance?.clock_in)
  const clockOutDisplay = getClockTimeString(attendance?.clock_out)
  const hasClockedIn = Boolean(clockInDisplay)
  const hasClockedOut = Boolean(clockOutDisplay)
  const cloudPhotoUrl =
    typeof attendance?.clock_in === 'object' && attendance?.clock_in?.photo_url
      ? attendance.clock_in.photo_url
      : null

  return (
    <Card className="rounded-2xl p-5 lg:p-6 mb-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <div className="flex items-center space-x-1.5 text-primary text-xs font-medium uppercase tracking-wider mb-0.5">
            <Icon icon={Location01Icon} size={14} />
            <span>Presensi Geofence & Biometrik</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Presensi Mandiri Karyawan</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">{currentDate}</p>
        </div>

        {/* Live Digital Clock: Clean & Simple */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-muted/50 border border-border text-foreground shadow-xs w-fit">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon icon={Clock01Icon} size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                Waktu Sistem
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tracking-tight text-foreground leading-tight">
              {currentTime || '08:00:00'} <span className="text-[10px] font-sans font-semibold text-muted-foreground">WIB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Status Bar */}
      <div className="my-4 p-3 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg border ${
              isWithinRadius
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
            }`}
          >
            <Icon icon={Location01Icon} size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-foreground">
                {activeBranch?.name || 'Jakarta Head Office'}
              </span>
              {distance !== null && (
                <Badge variant={isWithinRadius ? 'success' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {isWithinRadius ? 'Dalam Radius' : `Di Luar Radius (Maks. ${maxRadius}m)`}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              {distance !== null
                ? `Jarak ke kantor: ${distance} meter (Batas radius: ${maxRadius} meter)`
                : isLocating
                ? 'Mencari sinyal GPS...'
                : 'GPS belum terbaca'}
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
            <span>{isLocating ? 'Memindai...' : 'Perbarui GPS'}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="rounded-lg text-xs h-8 text-primary"
          >
            <Icon icon={CompassIcon} size={14} />
            <span>{showMap ? 'Tutup Peta' : 'Buka Peta'}</span>
          </Button>
        </div>
      </div>

      {/* INTERACTIVE LEAFLET GPS MAP */}
      {showMap && (
        <div className="mb-4 rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
          <div className="p-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-medium text-foreground">
              <Icon icon={CompassIcon} size={14} className="text-primary" />
              <span>Peta Validasi Radius & Lokasi Kantor</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={centerOnUser}
                disabled={!userCoords}
                className="px-2 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-medium text-foreground disabled:opacity-40"
              >
                Pusatkan Saya
              </button>
              <button
                type="button"
                onClick={centerOnOffice}
                className="px-2 py-1 rounded bg-background border border-border hover:bg-muted text-[11px] font-medium text-foreground"
              >
                Fokus Kantor
              </button>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-56 sm:h-64 bg-muted"
            style={{ zIndex: 10 }}
          />
        </div>
      )}

      {geoError && (
        <div className="mb-4 p-2.5 rounded-lg bg-secondary/20 border border-secondary/40 text-foreground text-xs flex items-center space-x-2 font-normal">
          <Icon icon={AlertCircleIcon} size={14} className="shrink-0 text-foreground" />
          <span>{geoError}</span>
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
          <div className="text-sm font-semibold text-foreground mt-1">
            {isLoading ? (
              <SkeletonBox height={20} width={110} radius={4} />
            ) : (
              <>
                {activeShift?.start_time ? activeShift.start_time.slice(0, 5) : '08:30'} -{' '}
                {activeShift?.end_time ? activeShift.end_time.slice(0, 5) : '17:30'} WIB
              </>
            )}
          </div>
          {isLoading ? (
            <SkeletonBox height={13} width={80} radius={3} className="mt-1" />
          ) : activeShift?.name ? (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{activeShift.name}</div>
          ) : null}
        </div>

        <div className="p-3.5 rounded-xl bg-secondary/25 border border-secondary/40">
          <div className="text-[11px] font-medium text-foreground/80 uppercase tracking-wide">Toleransi</div>
          <div className="text-sm font-semibold text-foreground mt-1">
            {isLoading ? (
              <SkeletonBox height={20} width={95} radius={4} />
            ) : (
              <>
                {activeShift?.late_tolerance_minutes ?? 15} Menit
                {(() => {
                  const start = activeShift?.start_time ? activeShift.start_time.slice(0, 5) : '08:30'
                  const tol = activeShift?.late_tolerance_minutes ?? 15
                  const parts = start.split(':')
                  const h = parseInt(parts[0], 10)
                  const m = parseInt(parts[1], 10)
                  if (isNaN(h) || isNaN(m)) return ''
                  const total = h * 60 + m + tol
                  const cutH = Math.floor(total / 60) % 24
                  const cutM = total % 60
                  return ` (s/d ${String(cutH).padStart(2, '0')}:${String(cutM).padStart(2, '0')})`
                })()}
              </>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Batas Tepat Waktu</div>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status Hari Ini</div>
          <div className="mt-1">
            {isLoading ? (
              <SkeletonBox height={22} width={80} radius={6} />
            ) : hasClockedIn ? (
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

      {/* LIVE CAMERA SELFIE SECTION (ANTI-FRAUD) */}
      <div className="mb-4 p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative w-14 h-14 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie Langsung" className="w-full h-full object-cover" />
            ) : cloudPhotoUrl ? (
              <img src={cloudPhotoUrl} alt="Foto Clock-In" className="w-full h-full object-cover" />
            ) : (
              <Icon icon={Camera01Icon} size={24} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground flex items-center space-x-2">
              <span>Verifikasi Selfie Kamera Langsung</span>
              {selfiePreview && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0.2">
                  Siap Dikirim
                </Badge>
              )}
              {!selfiePreview && cloudPhotoUrl && (
                <Badge variant="primarySubtle" className="text-[10px] px-1.5 py-0.2">
                  Cloudinary Terhubung
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
              {selfiePreview
                ? 'Foto langsung siap diunggah ke Cloudinary saat Clock-In/Out.'
                : cloudPhotoUrl
                ? 'Foto selfie presensi hari ini tersimpan di Cloudinary CDN.'
                : 'Foto diambil langsung dari kamera/webcam (bebas manipulasi file galeri).'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => startLiveCamera('user')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Icon icon={Camera01Icon} size={15} />
            <span>{selfiePreview ? 'Ambil Ulang' : 'Buka Kamera Langsung'}</span>
          </button>

          {selfiePreview && (
            <button
              type="button"
              onClick={() => {
                setSelfieFile(null)
                setSelfiePreview(null)
              }}
              className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Batalkan foto selfie"
            >
              <Icon icon={Cancel01Icon} size={15} />
            </button>
          )}
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
          placeholder="Catatan presensi (opsional)..."
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

      {/* DIRECT IN-APP WEBCAM MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-md w-full p-5 shadow-2xl border border-border space-y-4 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-semibold text-foreground">Kamera Presensi Langsung</h4>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Viewport for live video stream or captured photo */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-border">
              {flashAnimation && (
                <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-300 pointer-events-none" />
              )}

              {cameraError ? (
                <div className="p-6 text-center space-y-3 text-white">
                  <Icon icon={AlertCircleIcon} size={32} className="mx-auto text-rose-400" />
                  <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startLiveCamera(facingMode)}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : capturedSnapshot ? (
                <img
                  src={capturedSnapshot}
                  alt="Hasil Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />

                  {/* Face Guideline Oval Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center">
                      <span className="text-[10px] text-white/80 font-medium tracking-wide bg-black/40 px-2 py-0.5 rounded backdrop-blur-2xs">
                        Posisikan Wajah
                      </span>
                    </div>
                  </div>

                  {/* Real-time Anti-Fraud Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] text-white flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-emerald-400">● LIVE CAMERA FEED</div>
                      <div className="text-white/80">{currentTime} WIB • {activeBranch?.name || 'Kantor'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={switchCameraFacing}
                      className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[10px] font-medium text-white cursor-pointer"
                      title="Ganti kamera depan / belakang"
                    >
                      Putar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-between pt-1">
              {capturedSnapshot ? (
                <div className="flex items-center justify-between w-full space-x-2">
                  <button
                    type="button"
                    onClick={retakeCapturedPhoto}
                    className="flex-1 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs transition-colors"
                  >
                    Gunakan Foto Ini
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full space-x-4">
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-4 py-2 rounded-lg border border-border text-foreground text-xs hover:bg-muted transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={captureLivePhoto}
                    disabled={isCameraStarting || Boolean(cameraError)}
                    className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-primary/25 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                    title="Ambil Foto Sekarang"
                  >
                    <Icon icon={Camera01Icon} size={24} />
                  </button>

                  <div className="w-16" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

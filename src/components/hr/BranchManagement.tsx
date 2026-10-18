import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Building01Icon,
  CompassIcon,
  FloppyDiskIcon,
  Location01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { branchService } from '../../services/api'
import type { Branch } from '../../types'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form State
  const [name, setName] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [latitude, setLatitude] = useState<number>(-6.225014)
  const [longitude, setLongitude] = useState<number>(106.809657)
  const [radiusMeters, setRadiusMeters] = useState<number>(100)
  const [isActive, setIsActive] = useState<boolean>(true)

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  // Fetch branches
  const loadBranches = async () => {
    setIsLoading(true)
    try {
      const res = await branchService.getBranches()
      if (res.data?.success && res.data.data.length > 0) {
        setBranches(res.data.data)
        const defaultBranch = res.data.data[0]
        selectBranch(defaultBranch)
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat daftar cabang kantor.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectBranch = (branch: Branch) => {
    setSelectedBranchId(branch.id)
    setName(branch.name)
    setCode(branch.code)
    setAddress(branch.address || '')
    setLatitude(Number(branch.latitude))
    setLongitude(Number(branch.longitude))
    setRadiusMeters(Number(branch.radius_meters) || 100)
    setIsActive(branch.is_active ?? true)
    setFeedback(null)
  }

  useEffect(() => {
    loadBranches()
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Prevent duplicate map initialization
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Custom Brand Blue Marker Pin
      const pinIcon = L.divIcon({
        className: 'custom-office-pin',
        html: `
          <div style="
            background-color: #1358D0;
            width: 38px;
            height: 38px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(19, 88, 208, 0.45);
            border: 2px solid #ffffff;
            cursor: grab;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background-color: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      })

      const marker = L.marker([latitude, longitude], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map)

      const circle = L.circle([latitude, longitude], {
        radius: radiusMeters,
        color: '#1358D0',
        fillColor: '#1358D0',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '4, 6',
      }).addTo(map)

      marker.bindPopup(`<b>${name || 'Kantor Cabang'}</b><br>Geser pin untuk ubah koordinat.`).openPopup()

      // Handle marker drag
      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng()
        setLatitude(Number(newPos.lat.toFixed(6)))
        setLongitude(Number(newPos.lng.toFixed(6)))
        circle.setLatLng(newPos)
      })

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        circle.setLatLng([lat, lng])
        setLatitude(Number(lat.toFixed(6)))
        setLongitude(Number(lng.toFixed(6)))
      })

      mapInstanceRef.current = map
      markerRef.current = marker
      circleRef.current = circle
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapContainerRef.current])

  // Update map marker and circle when coordinates or radius change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const pos: L.LatLngExpression = [latitude, longitude]
      markerRef.current.setLatLng(pos)
      circleRef.current.setLatLng(pos)
      circleRef.current.setRadius(radiusMeters)
      mapInstanceRef.current.setView(pos, mapInstanceRef.current.getZoom())
    }
  }, [latitude, longitude, radiusMeters])

  // Get current device geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: 'error', message: 'Browser tidak mendukung GPS.' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setLatitude(lat)
        setLongitude(lng)
        setFeedback({
          type: 'success',
          message: `Koordinat GPS berhasil disetel ke posisi Anda (${lat}, ${lng}).`,
        })
      },
      (err) => {
        setFeedback({ type: 'error', message: `Gagal membaca GPS: ${err.message}` })
      },
      { enableHighAccuracy: true }
    )
  }

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId) return

    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await branchService.updateBranch(selectedBranchId, {
        name,
        code,
        address,
        latitude,
        longitude,
        radius_meters: radiusMeters,
        is_active: isActive,
      })

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || 'Lokasi kantor dan radius geofence berhasil diperbarui!',
        })
        // Refresh branch in list
        setBranches((prev) =>
          prev.map((b) => (b.id === selectedBranchId ? res.data.data : b))
        )
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan perubahan lokasi kantor.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-primary text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider mb-2">
            <Icon icon={Location01Icon} size={14} className="mr-1" />
            Geofence GPS & Office Management
          </Badge>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Pengaturan Titik Kantor & Radius Presensi
          </h2>
          <p className="text-white/85 text-xs mt-1 font-normal leading-relaxed">
            Atur koordinat lintang/bujur kantor secara visual menggunakan peta interaktif Leaflet. Geser pin atau klik peta untuk menetapkan koordinat presensi karyawan.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 border font-normal ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <Icon icon={CheckmarkCircle01Icon} size={16} className="shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <Icon icon={AlertCircleIcon} size={16} className="shrink-0 text-rose-500 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Map & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Leaflet Map Column */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Peta Titik Koordinat Kantor
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Klik di peta atau geser pin biru untuk memindahkan lokasi kantor.
                </CardDescription>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  className="rounded-lg text-xs gap-1.5 font-medium"
                >
                  <Icon icon={CompassIcon} size={14} className="text-primary" />
                  <span>Posisi Saya</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadBranches}
                  className="rounded-lg text-xs gap-1.5 font-medium"
                >
                  <Icon icon={RefreshIcon} size={14} className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Map Canvas Container */}
            <div className="w-full h-[420px] rounded-xl overflow-hidden border border-border relative z-10 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Coordinates Summary Footer */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-normal text-muted-foreground">Koordinat Terpilih:</span>
                <span className="font-medium text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  {latitude}, {longitude}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-normal text-muted-foreground">Radius Geofence:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {radiusMeters} meter
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Office Details & Geofence Settings Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Detail & Parameter Cabang
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                  HR Manager berwenang memperbarui batas geofence.
                </CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon icon={Building01Icon} size={18} />
              </div>
            </div>

            {/* Branch Selector Dropdown if multiple branches */}
            {branches.length > 1 && (
              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1">
                  Pilih Cabang Kantor
                </label>
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => {
                    const found = branches.find((b) => b.id === Number(e.target.value))
                    if (found) selectBranch(found)
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1">
                  Nama Cabang / Kantor
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Jakarta Head Office"
                  className="text-xs font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1">
                  Kode Cabang
                </label>
                <Input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: JKT-HQ"
                  className="text-xs font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1">
                  Alamat Lengkap Kantor
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Jenderal Sudirman Kav. 52-53..."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-1">
                    Latitude (Lintang)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="text-xs font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground uppercase tracking-wider mb-1">
                    Longitude (Bujur)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="text-xs font-normal"
                  />
                </div>
              </div>

              {/* Radius Slider with live feedback */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex justify-between items-center text-xs font-normal">
                  <span className="text-foreground">Radius Toleransi Geofence:</span>
                  <span className="text-primary font-medium text-xs">{radiusMeters} meter</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
                  <span>20m</span>
                  <span>100m (Standar)</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving || !selectedBranchId}
                className="w-full h-10 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-2 mt-2 text-xs"
              >
                <Icon icon={FloppyDiskIcon} size={16} />
                <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Koordinat & Lokasi'}</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

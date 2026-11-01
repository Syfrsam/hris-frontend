import React, { useEffect, useState } from 'react'
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  FloppyDiskIcon,
  InformationCircleIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { SkeletonBox } from '../ui/skeleton'
import { penaltyService } from '../../services/api'
import type { PenaltySetting } from '../../types'

export const PenaltySettings: React.FC = () => {
  const [setting, setSetting] = useState<PenaltySetting | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form states
  const [latePenaltyType, setLatePenaltyType] = useState<'hourly_rate' | 'salary_proportional' | 'fixed_per_incident' | 'none'>('hourly_rate')
  const [hourlyRate, setHourlyRate] = useState<number>(25000)
  const [incidentRate, setIncidentRate] = useState<number>(50000)
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(15)
  const [absentPenaltyType, setAbsentPenaltyType] = useState<'salary_proportional' | 'fixed_daily'>('salary_proportional')
  const [absentDailyAmount, setAbsentDailyAmount] = useState<number>(150000)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')
  const [recalculateActiveDraft, setRecalculateActiveDraft] = useState<boolean>(true)

  const loadSettings = async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const res = await penaltyService.getSettings()
      if (res.data?.success && res.data.data) {
        const s: PenaltySetting = res.data.data
        setSetting(s)
        setLatePenaltyType(s.late_penalty_type || 'hourly_rate')
        setHourlyRate(Number(s.hourly_rate) || 25000)
        setIncidentRate(Number(s.incident_rate) || 50000)
        setGracePeriodMinutes(Number(s.grace_period_minutes) ?? 15)
        setAbsentPenaltyType(s.absent_penalty_type || 'salary_proportional')
        setAbsentDailyAmount(Number(s.absent_daily_amount) || 150000)
        setIsActive(s.is_active ?? true)
        setNotes(s.notes || '')
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat konfigurasi peraturan denda.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0)
  }

  // Live simulation for preview
  const calcSimulatedLateDeduction = (minutes: number) => {
    if (!isActive || latePenaltyType === 'none') return 0
    if (minutes <= gracePeriodMinutes) return 0
    if (latePenaltyType === 'hourly_rate') {
      return Math.round((minutes / 60) * hourlyRate)
    }
    if (latePenaltyType === 'fixed_per_incident') {
      return incidentRate
    }
    // salary_proportional simulation assuming Rp 5,000,000 basic salary
    return Math.round(minutes * (5000000 / (21 * 8 * 60)))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await penaltyService.updateSettings({
        late_penalty_type: latePenaltyType,
        hourly_rate: hourlyRate,
        incident_rate: incidentRate,
        grace_period_minutes: gracePeriodMinutes,
        absent_penalty_type: absentPenaltyType,
        absent_daily_amount: absentDailyAmount,
        is_active: isActive,
        notes: notes.trim(),
        recalculate_active_draft: recalculateActiveDraft,
      })

      if (res.data?.success) {
        setSetting(res.data.data)
        setFeedback({
          type: 'success',
          message: res.data.message || 'Peraturan denda berhasil disimpan!',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan pengaturan denda.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-primary text-primary-foreground p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <h2 className="text-base sm:text-xl font-semibold tracking-tight text-white">
              Peraturan Denda & Pemotongan
            </h2>
            <p className="text-primary-foreground/85 text-xs mt-1 font-normal leading-relaxed">
              Atur skema denda keterlambatan, batas toleransi shift, dan potongan ketidakhadiran kerja.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => loadSettings()}
              disabled={isLoading}
              className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Segarkan data peraturan denda"
            >
              <Icon
                icon={RefreshIcon}
                size={14}
                className={isLoading ? 'animate-spin' : ''}
              />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl text-xs flex items-start space-x-2.5 border font-normal ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
          }`}
        >
          {feedback.type === 'success' ? (
            <Icon icon={CheckmarkCircle01Icon} size={16} className="shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <Icon icon={AlertCircleIcon} size={16} className="shrink-0 text-rose-500 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      {isLoading ? (
        /* 1:1 Matching Skullet Skeleton of Form & Live Simulation */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Main Form Skeleton */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5">
            {/* Master Toggle Status Skeleton */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 max-w-xl flex-1">
                  <div className="flex items-center gap-2">
                    <SkeletonBox height={16} width={180} radius={4} />
                    <SkeletonBox height={20} width={48} radius={999} />
                  </div>
                  <SkeletonBox height={12} width={340} radius={4} />
                </div>
                <SkeletonBox height={24} width={44} radius={999} className="shrink-0" />
              </div>
            </div>

            {/* Scheme Cards Skeleton */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
              <div className="space-y-1.5">
                <SkeletonBox height={16} width={220} radius={4} />
                <SkeletonBox height={12} width={380} radius={4} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <SkeletonBox height={14} width="65%" radius={4} />
                      <SkeletonBox height={16} width={16} radius="50%" />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={11} width="92%" radius={3} />
                      <SkeletonBox height={11} width="75%" radius={3} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toleransi & Nominal Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
                <div className="space-y-1">
                  <SkeletonBox height={14} width={140} radius={4} />
                  <SkeletonBox height={11} width={220} radius={3} />
                </div>
                <SkeletonBox height={38} width="100%" radius={8} />
                <SkeletonBox height={10} width={160} radius={3} />
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
                <div className="space-y-1">
                  <SkeletonBox height={14} width={160} radius={4} />
                  <SkeletonBox height={11} width={240} radius={3} />
                </div>
                <SkeletonBox height={38} width="100%" radius={8} />
                <SkeletonBox height={10} width={180} radius={3} />
              </div>
            </div>

            {/* Absent Penalty Policy Skeleton */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
              <div className="space-y-1.5">
                <SkeletonBox height={16} width={230} radius={4} />
                <SkeletonBox height={12} width={360} radius={4} />
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="p-3.5 rounded-xl border border-border/80 bg-card flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <SkeletonBox height={13} width={180} radius={4} />
                    <SkeletonBox height={11} width={260} radius={3} />
                  </div>
                  <SkeletonBox height={16} width={16} radius="50%" />
                </div>
                <div className="p-3.5 rounded-xl border border-border/80 bg-card flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <SkeletonBox height={13} width={200} radius={4} />
                    <SkeletonBox height={11} width={280} radius={3} />
                  </div>
                  <SkeletonBox height={16} width={16} radius="50%" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-5">
            {/* Live Simulation Card Skeleton */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3.5">
              <div className="space-y-1">
                <SkeletonBox height={15} width={170} radius={4} />
                <SkeletonBox height={11} width={210} radius={3} />
              </div>

              <div className="space-y-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between">
                    <SkeletonBox height={12} width={100} radius={3} />
                    <SkeletonBox height={18} width={75} radius={999} />
                  </div>
                ))}
              </div>

              <SkeletonBox height={11} width={230} radius={3} />
            </div>

            {/* Recalculate & Save Card Skeleton */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
              <SkeletonBox height={14} width="85%" radius={4} />
              <SkeletonBox height={42} width="100%" radius={12} />
              <div className="flex justify-center pt-1">
                <SkeletonBox height={11} width={180} radius={3} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Main Form Settings */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5">
            {/* Master Toggle Status */}
            <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-xl">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>Kebijakan Pemotongan Denda</span>
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px]">
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal">
                    Jika dinonaktifkan, keterlambatan tidak memotong nominal gaji karyawan.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </Card>

            {/* Skema Denda Keterlambatan */}
            <Card className="p-5 rounded-2xl border border-border shadow-xs space-y-4">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Icon icon={Clock01Icon} size={18} className="text-primary" />
                  <span>Skema Perhitungan Denda Keterlambatan</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Metode perhitungan denda keterlambatan pada slip gaji karyawan.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opsi 1: Hourly Rate Flat */}
                <div
                  onClick={() => setLatePenaltyType('hourly_rate')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    latePenaltyType === 'hourly_rate'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Tarif per Jam
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-normal leading-relaxed">
                        Dihitung proporsional menit dari tarif per jam yang ditetapkan.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="latePenaltyType"
                      checked={latePenaltyType === 'hourly_rate'}
                      onChange={() => setLatePenaltyType('hourly_rate')}
                      className="mt-0.5 accent-primary"
                    />
                  </div>

                  {latePenaltyType === 'hourly_rate' && (
                    <div className="mt-3 pt-3 border-t border-border/80">
                      <label className="block text-[11px] font-medium text-foreground mb-1 uppercase tracking-wider">
                        Tarif per Jam
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(Number(e.target.value))}
                          className="pl-9 text-xs font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Opsi 2: Salary Proportional */}
                <div
                  onClick={() => setLatePenaltyType('salary_proportional')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    latePenaltyType === 'salary_proportional'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Proporsional Gaji Pokok
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-normal leading-relaxed">
                        Proporsional dari gaji pokok berdasarkan regulasi ketenagakerjaan.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="latePenaltyType"
                      checked={latePenaltyType === 'salary_proportional'}
                      onChange={() => setLatePenaltyType('salary_proportional')}
                      className="mt-0.5 accent-primary"
                    />
                  </div>

                  {latePenaltyType === 'salary_proportional' && (
                    <div className="mt-3 pt-3 border-t border-border/80 space-y-1.5">
                      <div className="text-[11px] font-medium text-foreground uppercase tracking-wider">
                        Formula Perhitungan
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border font-mono text-[11px] text-foreground font-semibold">
                        (Gaji Pokok ÷ 10.080) × Menit Terlambat
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        10.080 menit dihitung dari 21 hari kerja × 8 jam × 60 menit per bulan. Potongan denda otomatis proporsional sesuai nominal gaji pokok tiap karyawan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Opsi 3: Fixed per Incident */}
                <div
                  onClick={() => setLatePenaltyType('fixed_per_incident')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    latePenaltyType === 'fixed_per_incident'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Nominal Tetap per Kejadian
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-normal leading-relaxed">
                        Denda bernilai sama setiap kali terlambat tanpa melihat durasi menit.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="latePenaltyType"
                      checked={latePenaltyType === 'fixed_per_incident'}
                      onChange={() => setLatePenaltyType('fixed_per_incident')}
                      className="mt-0.5 accent-primary"
                    />
                  </div>

                  {latePenaltyType === 'fixed_per_incident' && (
                    <div className="mt-3 pt-3 border-t border-border/80">
                      <label className="block text-[11px] font-medium text-foreground mb-1 uppercase tracking-wider">
                        Tarif per Kejadian
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={incidentRate}
                          onChange={(e) => setIncidentRate(Number(e.target.value))}
                          className="pl-9 text-xs font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Opsi 4: None */}
                <div
                  onClick={() => setLatePenaltyType('none')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    latePenaltyType === 'none'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Bebas Denda Keterlambatan
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-normal leading-relaxed">
                        Keterlambatan dicatat tanpa potongan denda pada gaji.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="latePenaltyType"
                      checked={latePenaltyType === 'none'}
                      onChange={() => setLatePenaltyType('none')}
                      className="mt-0.5 accent-primary"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Toleransi & Alpa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Toleransi Keterlambatan */}
              <Card className="p-5 rounded-2xl border border-border shadow-xs space-y-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Batas Toleransi Keterlambatan
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                    Durasi toleransi menit sebelum denda keterlambatan berlaku.
                  </CardDescription>
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                      className="text-xs font-medium pr-12"
                      required
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                      Menit
                    </span>
                  </div>
                </div>
              </Card>

              {/* Skema Denda Ketidakhadiran (Alpa) */}
              <Card className="p-5 rounded-2xl border border-border shadow-xs space-y-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Potongan Ketidakhadiran (Alpa)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5 font-normal">
                    Metode pemotongan jika karyawan tidak hadir tanpa izin resmi.
                  </CardDescription>
                </div>

                <div className="space-y-2">
                  <select
                    value={absentPenaltyType}
                    onChange={(e) => setAbsentPenaltyType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="salary_proportional">Proporsional Gaji (1/21 per hari)</option>
                    <option value="fixed_daily">Tarif Tetap per Hari</option>
                  </select>

                  {absentPenaltyType === 'fixed_daily' && (
                    <div className="relative pt-1">
                      <span className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center text-xs font-medium text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        value={absentDailyAmount}
                        onChange={(e) => setAbsentDailyAmount(Number(e.target.value))}
                        className="pl-9 text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Catatan Kebijakan */}
            <Card className="p-5 rounded-2xl border border-border shadow-xs space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Catatan Kebijakan (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan SK Direksi atau kebijakan denda perusahaan..."
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </Card>
          </div>

          {/* Right Column: Live Simulation & Save Action */}
          <div className="lg:col-span-4 space-y-5">
            {/* Live Calculation Preview Card */}
            <Card className="p-5 rounded-2xl border border-border bg-muted/30 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-primary">
                <Icon icon={InformationCircleIcon} size={18} />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Simulasi Denda
                </CardTitle>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground text-[11px]">
                    <span className="truncate">Terlambat 25 Menit</span>
                    <span className="font-medium text-foreground shrink-0">25 mnt</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border">
                    <span className="font-normal text-muted-foreground">Potongan:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      -{formatRupiah(calcSimulatedLateDeduction(25))}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground text-[11px]">
                    <span className="truncate">Terlambat 50 Menit</span>
                    <span className="font-medium text-foreground shrink-0">50 mnt</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border">
                    <span className="font-normal text-muted-foreground">Potongan:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      -{formatRupiah(calcSimulatedLateDeduction(50))}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground text-[11px]">
                    <span className="truncate">Terlambat 10 Menit (≤ Toleransi)</span>
                    <span className="font-medium text-emerald-600 shrink-0">Aman</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border">
                    <span className="font-normal text-muted-foreground">Potongan:</span>
                    <span className="font-semibold text-emerald-600">Rp 0</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground font-normal leading-relaxed pt-1">
                Simulasi ini otomatis diterapkan pada slip gaji karyawan.
              </div>
            </Card>

            {/* Recalculate Draft Option & Submit */}
            <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-4">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={recalculateActiveDraft}
                  onChange={(e) => setRecalculateActiveDraft(e.target.checked)}
                  className="mt-0.5 rounded border-input accent-primary cursor-pointer shrink-0"
                />
                <span className="text-foreground font-normal text-xs leading-relaxed">
                  <strong>Hitung ulang draf payroll aktif</strong> bulan berjalan saat disimpan.
                </span>
              </label>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 sm:h-10 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xs gap-2 text-xs cursor-pointer active:scale-[0.98]"
              >
                <Icon icon={isSaving ? RefreshIcon : FloppyDiskIcon} size={16} className={isSaving ? 'animate-spin' : ''} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Peraturan Denda'}</span>
              </Button>

              {setting?.updated_by_user && (
                <div className="text-[10px] text-muted-foreground text-center pt-1 font-normal">
                  Terakhir diperbarui oleh: <strong className="text-foreground">{setting.updated_by_user.name}</strong>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
      )}
    </div>
  )
}

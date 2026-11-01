import React, { useState, useEffect, useMemo } from 'react'
import {
  DollarCircleIcon,
  Invoice01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Download01Icon,
  Cancel01Icon,
  EyeIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import api, { API_BASE_URL } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { PayrollPeriod, Payroll } from '../../types'
import { SkeletonBox } from '../ui/skeleton'

export const PayrollManagement: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.roles?.some((r) => ['HR Manager', 'Superadmin'].includes(r))

  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [generating, setGenerating] = useState<boolean>(false)
  const [authorizing, setAuthorizing] = useState<boolean>(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [periodForm, setPeriodForm] = useState({
    name: 'Payroll Periode ' + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    cutoff_date: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString().split('T')[0],
    payment_date: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toISOString().split('T')[0],
  })

  const loadPeriods = async () => {
    try {
      const res = await api.get('/payrolls/periods')
      const data: PayrollPeriod[] = res.data?.data || []
      setPeriods(data)
      if (data.length > 0) {
        if (!selectedPeriodId) {
          setSelectedPeriodId(data[0].id)
        }
      } else {
        setSelectedPeriodId(null)
        setPayrolls([])
        setLoading(false)
      }
    } catch (err) {
      console.error('Error loading payroll periods:', err)
      toast.error('Gagal Memuat Periode', 'Tidak dapat mengambil daftar periode payroll.')
      setLoading(false)
    }
  }

  const loadPayrollsForPeriod = async (periodId: number) => {
    setLoading(true)
    try {
      const res = await api.get(`/payrolls/periods/${periodId}/list`)
      const data: Payroll[] = res.data?.data || []
      setPayrolls(data)
    } catch (err) {
      console.error('Error loading payrolls for period:', err)
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  useEffect(() => {
    if (selectedPeriodId) {
      loadPayrollsForPeriod(selectedPeriodId)
      setCurrentPage(1)
    }
  }, [selectedPeriodId])

  const paginatedPayrolls = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return payrolls.slice(start, start + pageSize)
  }, [payrolls, currentPage, pageSize])

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId)
  }, [periods, selectedPeriodId])

  const summary = useMemo(() => {
    let basicTotal = 0
    let overtimeTotal = 0
    let deductionsTotal = 0
    let netTotal = 0

    payrolls.forEach((p) => {
      const basic = p.summary?.basic_salary ?? p.basic_salary ?? 0
      const ot = p.summary?.total_overtime_pay ?? p.total_overtime_pay ?? 0
      const ded = p.summary?.total_deductions ?? p.total_deductions ?? 0
      const net = p.summary?.net_salary ?? p.net_salary ?? 0

      basicTotal += Number(basic)
      overtimeTotal += Number(ot)
      deductionsTotal += Number(ded)
      netTotal += Number(net)
    })

    return {
      count: payrolls.length,
      basicTotal,
      overtimeTotal,
      deductionsTotal,
      netTotal,
    }
  }, [payrolls])

  const handleGenerateDraft = async () => {
    if (!selectedPeriodId) return
    setGenerating(true)
    try {
      const res = await api.post(`/payrolls/periods/${selectedPeriodId}/generate-draft`)
      toast.success(
        'Draf Payroll Dihasilkan!',
        res.data?.message || 'Kalkulasi gaji seluruh karyawan aktif berhasil diproses.'
      )
      await loadPayrollsForPeriod(selectedPeriodId)
      await loadPeriods()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal generate draft payroll.'
      toast.error('Gagal Generate', msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleAuthorizePeriod = async () => {
    if (!selectedPeriodId) return
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengesahkan dan menerbitkan slip gaji periode ini kepada seluruh karyawan?'
    )
    if (!confirmed) return

    setAuthorizing(true)
    try {
      const res = await api.post(`/payrolls/periods/${selectedPeriodId}/authorize`)
      toast.success(
        'Payroll Berhasil Disahkan!',
        res.data?.message || 'Slip gaji digital telah resmi diterbitkan ke portal karyawan.'
      )
      await loadPayrollsForPeriod(selectedPeriodId)
      await loadPeriods()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal otorisasi payroll.'
      toast.error('Otorisasi Gagal', msg)
    } finally {
      setAuthorizing(false)
    }
  }

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/payrolls/periods', periodForm)
      toast.success('Periode Baru Dibuat', res.data?.message || 'Periode berhasil ditambahkan.')
      setShowCreateModal(false)
      await loadPeriods()
      if (res.data?.data?.id) {
        setSelectedPeriodId(res.data.data.id)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal membuat periode.'
      toast.error('Gagal Membuat Periode', msg)
    }
  }

  const handleDownloadPdf = async (payrollId: number, payslipNumber: string) => {
    setDownloadingId(payrollId)
    try {
      const res = await api.get(`/payrolls/${payrollId}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Slip_Gaji_${payslipNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 1000)
      toast.success('Unduhan Berhasil', `Slip gaji ${payslipNumber} berhasil diunduh.`)
    } catch (err) {
      console.error('Blob download fallback to direct window:', err)
      const token = localStorage.getItem('hris_token') || ''
      const downloadUrl = `${API_BASE_URL}/payrolls/${payrollId}/download?token=${encodeURIComponent(token)}`
      window.open(downloadUrl, '_blank')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleViewPdf = (payrollId: number) => {
    const token = localStorage.getItem('hris_token') || ''
    const viewUrl = `${API_BASE_URL}/payrolls/${payrollId}/download?mode=view&token=${encodeURIComponent(token)}`
    window.open(viewUrl, '_blank')
  }

  const formatRupiah = (val?: number) => {
    if (typeof val !== 'number') return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-primary font-normal text-xs uppercase tracking-wider mb-1">
            <Icon icon={DollarCircleIcon} size={15} />
            <span>Engine Penggajian & Rekapitulasi</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Manajemen Payroll Bulanan
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Kalkulasi gaji bersih, potongan BPJS, PPh 21, dan pengesahan digital.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg text-xs transition-colors border border-border"
          >
            + Buat Periode Baru
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Periode:
          </span>
          <select
            value={selectedPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
            className="bg-muted border border-border text-foreground text-xs font-normal rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {periods.length === 0 ? (
              <option value="">Belum ada periode</option>
            ) : (
              periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cutoff_date?.slice(0, 10)} Cut-off)
                </option>
              ))
            )}
          </select>

          {selectedPeriod && (
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium capitalize border ${
                selectedPeriod.status === 'authorized'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                  : 'bg-secondary text-secondary-foreground border-secondary/40'
              }`}
            >
              Status: {selectedPeriod.status}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateDraft}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Icon icon={Invoice01Icon} size={15} />
            <span>{generating ? 'Mengkalkulasi...' : '1-Click Generate Draf'}</span>
          </button>

          {isHrManager && selectedPeriod?.status !== 'authorized' && (
            <button
              type="button"
              disabled={authorizing || payrolls.length === 0}
              onClick={handleAuthorizePeriod}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Icon icon={CheckmarkCircle01Icon} size={15} />
              <span>{authorizing ? 'Mengesahkan...' : 'Otorisasi & Publikasikan'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Karyawan Terproses
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {loading ? <SkeletonBox height={24} width={45} radius={6} /> : summary.count}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Slip gaji terhitung</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wider">
            Total Gaji Pokok
          </div>
          <div className="text-base font-semibold text-foreground mt-1">
            {loading ? <SkeletonBox height={20} width={120} radius={6} /> : formatRupiah(summary.basicTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Basis kontrak aktif</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Total Potongan
          </div>
          <div className="text-base font-semibold text-rose-600 dark:text-rose-400 mt-1">
            {loading ? <SkeletonBox height={20} width={110} radius={6} /> : formatRupiah(summary.deductionsTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">BPJS, PPh 21 & Telat</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wider">
            Total Pengeluaran Net
          </div>
          <div className="text-base font-semibold text-primary mt-1">
            {loading ? <SkeletonBox height={20} width={130} radius={6} /> : formatRupiah(summary.netTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Siap ditransfer</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground tracking-tight">
            Rincian Kalkulasi Slip Gaji Karyawan
          </h3>
          <span className="text-xs font-medium text-muted-foreground">
            {payrolls.length} Karyawan
          </span>
        </div>

        {loading ? (
          <div>
            {/* Desktop Skullet Table Skeleton */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/40 text-[11px] font-normal text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-4 w-[20%]">Karyawan</th>
                    <th className="py-2.5 px-4 w-[14%]">No Slip Gaji</th>
                    <th className="py-2.5 px-4 w-[11%]">Gaji Pokok</th>
                    <th className="py-2.5 px-4 w-[11%]">Tunjangan</th>
                    <th className="py-2.5 px-4 w-[11%]">Upah Lembur</th>
                    <th className="py-2.5 px-4 w-[11%]">Potongan</th>
                    <th className="py-2.5 px-4 w-[12%]">Gaji Bersih (Net)</th>
                    <th className="py-2.5 px-4 w-[10%] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4">
                        <div className="space-y-1.5">
                          <SkeletonBox height={14} width="75%" radius={4} />
                          <SkeletonBox height={10} width="50%" radius={3} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={13} width={100} radius={4} />
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={13} width={85} radius={4} />
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={13} width={70} radius={4} />
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={13} width={70} radius={4} />
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={13} width={70} radius={4} />
                      </td>
                      <td className="py-2.5 px-4">
                        <SkeletonBox height={14} width={90} radius={4} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <SkeletonBox height={28} width={48} radius={8} />
                          <SkeletonBox height={28} width={48} radius={8} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Skullet Cards Skeleton */}
            <div className="block sm:hidden divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <SkeletonBox height={14} width="70%" radius={4} />
                      <SkeletonBox height={10} width="50%" radius={3} />
                    </div>
                    <SkeletonBox height={16} width={80} radius={4} className="shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={12} width="75%" radius={4} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={12} width="75%" radius={4} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={12} width="75%" radius={4} />
                    </div>
                    <div className="space-y-1">
                      <SkeletonBox height={10} width="50%" radius={3} />
                      <SkeletonBox height={12} width="85%" radius={4} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SkeletonBox height={28} width="50%" radius={8} />
                    <SkeletonBox height={28} width="50%" radius={8} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : periods.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={Invoice01Icon} size={22} className="text-muted-foreground" />
            <span className="text-sm font-normal text-foreground">
              Belum Ada Periode Payroll
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Klik &ldquo;+ Buat Periode Baru&rdquo; di kanan atas untuk membuat periode penggajian baru.
            </span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={AlertCircleIcon} size={22} className="text-muted-foreground" />
            <span className="text-sm font-normal text-foreground">
              Belum Ada Kalkulasi untuk Periode Ini
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Klik &ldquo;1-Click Generate Draf&rdquo; di atas untuk mengeksekusi kalkulasi otomatis seluruh karyawan.
            </span>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Perhitungan Transparan: <strong className="text-foreground">Gaji Bersih (Net)</strong> = (Gaji Pokok + Tunjangan + Lembur) - Total Potongan (BPJS, PPh 21, Denda/Absensi)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Semua Potongan Otomatis Terpotong</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/40 text-[11px] font-normal text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-4 w-[20%]">Karyawan</th>
                    <th className="py-2.5 px-4 w-[14%]">No Slip Gaji</th>
                    <th className="py-2.5 px-4 w-[11%]">Gaji Pokok</th>
                    <th className="py-2.5 px-4 w-[11%]">Tunjangan</th>
                    <th className="py-2.5 px-4 w-[11%]">Upah Lembur</th>
                    <th className="py-2.5 px-4 w-[11%]">Potongan</th>
                    <th className="py-2.5 px-4 w-[12%]">Gaji Bersih (Net)</th>
                    <th className="py-2.5 px-4 w-[10%] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedPayrolls.map((p) => {
                    const basic = p.summary?.basic_salary ?? p.basic_salary ?? 0
                    const allowances = p.summary?.total_allowances ?? p.total_allowances ?? 0
                    const ot = p.summary?.total_overtime_pay ?? p.total_overtime_pay ?? 0
                    const ded = p.summary?.total_deductions ?? p.total_deductions ?? 0
                    const net = p.summary?.net_salary ?? p.net_salary ?? 0

                    return (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-normal text-foreground text-xs">
                            {(p.employee as any)?.name || p.employee?.user?.name || 'Karyawan'}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            NIK: {(p.employee as any)?.nik || p.employee?.nik || '-'} • {typeof (p.employee as any)?.department === 'string' ? (p.employee as any).department : p.employee?.department?.name || 'Divisi'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs font-normal text-primary font-mono">
                          {p.payslip_number}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-normal text-muted-foreground">
                          {formatRupiah(basic)}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(allowances)}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-normal text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(ot)}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-normal text-rose-600 dark:text-rose-400">
                          -{formatRupiah(ded)}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-semibold text-foreground">
                          {formatRupiah(net)}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleViewPdf(p.id)}
                            title="Lihat / Cetak Slip PDF di tab baru"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors border border-border cursor-pointer"
                          >
                            <Icon icon={EyeIcon} size={13} />
                            <span>Lihat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(p.id, p.payslip_number)}
                            disabled={downloadingId === p.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            <Icon icon={Download01Icon} size={13} className={downloadingId === p.id ? 'animate-spin' : ''} />
                            <span>{downloadingId === p.id ? 'Mengunduh...' : 'PDF'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-border">
              {paginatedPayrolls.map((p) => {
                const basic = p.summary?.basic_salary ?? p.basic_salary ?? 0
                const allowances = p.summary?.total_allowances ?? p.total_allowances ?? 0
                const ot = p.summary?.total_overtime_pay ?? p.total_overtime_pay ?? 0
                const ded = p.summary?.total_deductions ?? p.total_deductions ?? 0
                const net = p.summary?.net_salary ?? p.net_salary ?? 0

                return (
                  <div key={p.id} className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-xs truncate">
                          {(p.employee as any)?.name || p.employee?.user?.name || 'Karyawan'}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          NIK: {(p.employee as any)?.nik || p.employee?.nik || '-'} • {typeof (p.employee as any)?.department === 'string' ? (p.employee as any).department : p.employee?.department?.name || 'Divisi'}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-primary font-medium shrink-0">
                        {p.payslip_number}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border border-border/60 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-normal">Gaji Pokok</span>
                        <span className="font-normal text-muted-foreground text-[11px] block">
                          {formatRupiah(basic)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-normal">Tunjangan & Lembur</span>
                        <span className="font-normal text-emerald-600 dark:text-emerald-400 text-[11px] block">
                          +{formatRupiah(allowances + ot)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-normal">Total Potongan</span>
                        <span className="font-normal text-rose-600 dark:text-rose-400 text-[11px] block">
                          -{formatRupiah(ded)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-normal">Gaji Bersih (Net)</span>
                        <span className="font-semibold text-foreground text-[11px] block">
                          {formatRupiah(net)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleViewPdf(p.id)}
                        className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors border border-border cursor-pointer"
                      >
                        <Icon icon={EyeIcon} size={13} />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(p.id, p.payslip_number)}
                        disabled={downloadingId === p.id}
                        className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Icon icon={Download01Icon} size={13} className={downloadingId === p.id ? 'animate-spin' : ''} />
                        <span>{downloadingId === p.id ? 'Mengunduh...' : 'Unduh PDF'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

          <Pagination
            currentPage={currentPage}
            totalItems={payrolls.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-medium text-foreground">
                  Buka Periode Payroll Baru
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Atur rentang tanggal cut-off absensi (tgl 25) dan tanggal pembayaran gaji.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Icon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-normal text-foreground mb-1 uppercase tracking-wider text-[11px]">
                  Nama Periode *
                </label>
                <input
                  type="text"
                  required
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.start_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Tanggal Cut-off *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.cutoff_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, cutoff_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                  Tanggal Pembayaran Gaji *
                </label>
                <input
                  type="date"
                  required
                  value={periodForm.payment_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

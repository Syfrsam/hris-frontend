import React, { useState, useEffect, useMemo } from 'react'
import {
  DollarCircleIcon,
  Invoice01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Download01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { PayrollPeriod, Payroll } from '../../types'

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
    }
  }, [selectedPeriodId])

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
      link.remove()
      toast.info('Unduhan Dimulai', `Slip gaji ${payslipNumber} berhasil diunduh.`)
    } catch (err) {
      toast.error('Gagal Mengunduh', 'Tidak dapat mengunduh slip PDF.')
    }
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <Icon icon={Invoice01Icon} size={15} />
            <span>{generating ? 'Mengkalkulasi...' : '1-Click Generate Draf'}</span>
          </button>

          {isHrManager && selectedPeriod?.status !== 'authorized' && (
            <button
              type="button"
              disabled={authorizing || payrolls.length === 0}
              onClick={handleAuthorizePeriod}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 border border-secondary/40"
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
            {summary.count}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Slip gaji terhitung</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wider">
            Total Gaji Pokok
          </div>
          <div className="text-base font-semibold text-foreground mt-1">
            {formatRupiah(summary.basicTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Basis kontrak aktif</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Total Potongan
          </div>
          <div className="text-base font-semibold text-rose-600 dark:text-rose-400 mt-1">
            {formatRupiah(summary.deductionsTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">BPJS, PPh 21 & Telat</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
          <div className="text-[11px] font-medium text-primary uppercase tracking-wider">
            Total Pengeluaran Net
          </div>
          <div className="text-base font-semibold text-primary mt-1">
            {formatRupiah(summary.netTotal)}
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
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2 font-normal">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Memuat data rekapitulasi gaji...</span>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-[11px] font-normal text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Karyawan</th>
                  <th className="py-2.5 px-4">No Slip Gaji</th>
                  <th className="py-2.5 px-4">Gaji Pokok</th>
                  <th className="py-2.5 px-4">Upah Lembur</th>
                  <th className="py-2.5 px-4">Potongan</th>
                  <th className="py-2.5 px-4">Gaji Bersih (Net)</th>
                  <th className="py-2.5 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payrolls.map((p) => {
                  const basic = p.summary?.basic_salary ?? p.basic_salary ?? 0
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
                      <td className="py-2.5 px-4 text-xs font-normal text-primary">
                        {p.payslip_number}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-normal text-muted-foreground">
                        {formatRupiah(basic)}
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
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(p.id, p.payslip_number)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors border border-border"
                        >
                          <Icon icon={Download01Icon} size={13} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors"
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

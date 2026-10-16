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
      if (data.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(data[0].id)
      }
    } catch (err) {
      console.error('Error loading payroll periods:', err)
      toast.error('Gagal Memuat Periode', 'Tidak dapat mengambil daftar periode payroll.')
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Icon icon={DollarCircleIcon} size={16} />
            <span>Engine Penggajian & Rekapitulasi</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Payroll Bulanan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Otomasi kalkulasi gaji bersih dengan formula Depnaker, potongan BPJS Ketenagakerjaan & Kesehatan, PPh 21, dan pengesahan digital.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
          >
            + Buat Periode Baru
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Periode Aktif:
          </span>
          <select
            value={selectedPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl px-4 py-2 focus:outline-none focus:border-indigo-500"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cutoff_date} Cut-off)
              </option>
            ))}
          </select>

          {selectedPeriod && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                selectedPeriod.status === 'authorized'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Status: {selectedPeriod.status}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateDraft}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Icon icon={Invoice01Icon} size={16} />
            <span>{generating ? 'Mengkalkulasi...' : '1-Click Generate Draf'}</span>
          </button>

          {isHrManager && selectedPeriod?.status !== 'authorized' && (
            <button
              type="button"
              disabled={authorizing || payrolls.length === 0}
              onClick={handleAuthorizePeriod}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Icon icon={CheckmarkCircle01Icon} size={16} />
              <span>{authorizing ? 'Mengesahkan...' : 'Otorisasi & Publikasikan'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Karyawan Terproses
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {summary.count}
          </div>
          <div className="text-xs text-slate-500 mt-1">Slip gaji terhitung</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Total Gaji Pokok
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(summary.basicTotal)}
          </div>
          <div className="text-xs text-indigo-700/80 mt-1">Basis kontrak aktif</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Total Potongan
          </div>
          <div className="text-xl font-black text-rose-600 mt-2 font-mono">
            {formatRupiah(summary.deductionsTotal)}
          </div>
          <div className="text-xs text-rose-500 mt-1">BPJS, PPh 21 & Keterlambatan</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Total Pengeluaran Net
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2 font-mono">
            {formatRupiah(summary.netTotal)}
          </div>
          <div className="text-xs text-emerald-700 mt-1">Siap ditransfer ke bank</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Rincian Kalkulasi Slip Gaji Karyawan
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {payrolls.length} Karyawan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat data rekapitulasi gaji...</span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 border border-amber-100">
              <Icon icon={AlertCircleIcon} size={24} />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Belum Ada Kalkulasi untuk Periode Ini
            </span>
            <span className="text-xs text-slate-400 max-w-sm">
              Klik tombol &ldquo;1-Click Generate Draf&rdquo; di atas untuk mengeksekusi kalkulasi otomatis seluruh karyawan.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Karyawan</th>
                  <th className="py-3.5 px-6">No Slip Gaji</th>
                  <th className="py-3.5 px-6">Gaji Pokok</th>
                  <th className="py-3.5 px-6">Upah Lembur</th>
                  <th className="py-3.5 px-6">Potongan</th>
                  <th className="py-3.5 px-6">Gaji Bersih (Net)</th>
                  <th className="py-3.5 px-6 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((p) => {
                  const basic = p.summary?.basic_salary ?? p.basic_salary ?? 0
                  const ot = p.summary?.total_overtime_pay ?? p.total_overtime_pay ?? 0
                  const ded = p.summary?.total_deductions ?? p.total_deductions ?? 0
                  const net = p.summary?.net_salary ?? p.net_salary ?? 0

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {(p.employee as any)?.name || p.employee?.user?.name || 'Karyawan'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          NIK: {(p.employee as any)?.nik || p.employee?.nik || '-'} • {typeof (p.employee as any)?.department === 'string' ? (p.employee as any).department : p.employee?.department?.name || 'Divisi'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-indigo-700">
                        {p.payslip_number}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800">
                        {formatRupiah(basic)}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-600">
                        {formatRupiah(ot)}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-rose-600">
                        -{formatRupiah(ded)}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-black text-slate-900">
                        {formatRupiah(net)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(p.id, p.payslip_number)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs transition-colors"
                        >
                          <Icon icon={Download01Icon} size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Buka Periode Payroll Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur rentang tanggal cut-off absensi (tgl 25) dan tanggal pembayaran gaji.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <Icon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Periode *
                </label>
                <input
                  type="text"
                  required
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.start_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Cut-off *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.cutoff_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, cutoff_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Pembayaran Gaji *
                </label>
                <input
                  type="date"
                  required
                  value={periodForm.payment_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
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

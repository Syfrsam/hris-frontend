import React, { useEffect, useState } from 'react'
import { Cancel01Icon, Download01Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { payrollService } from '../../services/api'
import type { Payroll } from '../../types'

export const PayslipViewer: React.FC = () => {
  const [payslips, setPayslips] = useState<Payroll[]>([])
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDownloading, setIsDownloading] = useState<number | null>(null)

  const fetchPayslips = async () => {
    setIsLoading(true)
    try {
      const res = await payrollService.getMyPayslips()
      if (res.data?.success) {
        setPayslips(res.data.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayslips()
  }, [])

  const handleDownloadPdf = async (payroll: Payroll) => {
    setIsDownloading(payroll.id)
    try {
      const res = await payrollService.downloadPdf(payroll.id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Slip_Gaji_${payroll.payslip_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      alert('Gagal mengunduh dokumen slip gaji PDF.')
    } finally {
      setIsDownloading(null)
    }
  }

  const formatRupiah = (num: number | undefined) => {
    const val = typeof num === 'number' && !isNaN(num) ? num : 0
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val)
  }

  const getBasicSalary = (p: Payroll) => p.summary?.basic_salary ?? p.basic_salary ?? 0
  const getAllowancesAndOt = (p: Payroll) => (p.summary?.total_allowances ?? p.total_allowances ?? 0) + (p.summary?.total_overtime_pay ?? p.total_overtime_pay ?? 0)
  const getTotalDeductions = (p: Payroll) => p.summary?.total_deductions ?? p.total_deductions ?? 0
  const getNetSalary = (p: Payroll) => p.summary?.net_salary ?? p.net_salary ?? 0

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Slip Gaji Digital (Payslip)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Arsip dokumen penghasilan resmi yang telah disahkan oleh HR Manager
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 px-3">No. Slip Gaji</th>
              <th className="pb-3 px-3">Periode Payroll</th>
              <th className="pb-3 px-3">Gaji Pokok</th>
              <th className="pb-3 px-3">Tunjangan & Lembur</th>
              <th className="pb-3 px-3">Potongan</th>
              <th className="pb-3 px-3">Take Home Pay</th>
              <th className="pb-3 px-3 text-right">Aksi Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Memuat data slip gaji...
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Belum ada slip gaji yang dipublikasikan untuk akun ini.
                </td>
              </tr>
            ) : (
              payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-indigo-600">
                    {p.payslip_number}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {p.period?.name || 'Periode Bulanan'}
                  </td>
                  <td className="py-3 px-3 text-xs">{formatRupiah(getBasicSalary(p))}</td>
                  <td className="py-3 px-3 text-xs text-emerald-600 font-semibold">
                    +{formatRupiah(getAllowancesAndOt(p))}
                  </td>
                  <td className="py-3 px-3 text-xs text-rose-600 font-semibold">
                    -{formatRupiah(getTotalDeductions(p))}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 font-mono text-sm">
                    {formatRupiah(getNetSalary(p))}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSlip(p)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center space-x-1"
                    >
                      <Icon icon={ViewIcon} size={15} />
                      <span>Rincian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(p)}
                      disabled={isDownloading === p.id}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 inline-flex items-center space-x-1 shadow-sm"
                    >
                      <Icon icon={Download01Icon} size={15} />
                      <span>{isDownloading === p.id ? 'Mengunduh...' : 'PDF'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Breakdown Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setSelectedSlip(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <Icon icon={Cancel01Icon} size={20} />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ Sah & Otorisasi HR
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Rincian Slip Gaji Karyawan</h3>
            <p className="text-xs font-mono text-indigo-600 mb-6">{selectedSlip.payslip_number}</p>

            <div className="space-y-4">
              {/* Earnings */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Penghasilan & Tunjangan
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gaji Pokok</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(getBasicSalary(selectedSlip))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tunjangan Tetap</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(selectedSlip.summary?.total_allowances ?? selectedSlip.total_allowances)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Upah Lembur (Depnaker)</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatRupiah(selectedSlip.summary?.total_overtime_pay ?? selectedSlip.total_overtime_pay)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Potongan & Kewajiban
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Potongan Keterlambatan</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(selectedSlip.summary?.late_deduction_amount ?? selectedSlip.late_deduction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Iuran BPJS Kesehatan</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(selectedSlip.summary?.bpjs_kesehatan ?? selectedSlip.bpjs_kesehatan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Iuran BPJS Ketenagakerjaan</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(selectedSlip.summary?.bpjs_ketenagakerjaan ?? selectedSlip.bpjs_ketenagakerjaan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pajak PPh 21</span>
                    <span className="font-semibold text-rose-600">
                      -{formatRupiah(selectedSlip.summary?.tax_pph21 ?? selectedSlip.tax_pph21)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Total */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-lg">
                <div>
                  <div className="text-xs text-indigo-300 font-medium">TOTAL GAJI BERSIH (NET)</div>
                  <div className="text-2xl font-black font-mono">
                    {formatRupiah(getNetSalary(selectedSlip))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedSlip)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-indigo-50 transition-colors inline-flex items-center space-x-1.5"
                >
                  <Icon icon={Download01Icon} size={15} />
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

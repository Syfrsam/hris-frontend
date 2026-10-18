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
    <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Slip Gaji Digital (Payslip)</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Arsip dokumen penghasilan resmi yang telah disahkan oleh HR Manager.
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase text-muted-foreground/80">
              <th className="pb-2.5 px-3">No. Slip Gaji</th>
              <th className="pb-2.5 px-3">Periode Payroll</th>
              <th className="pb-2.5 px-3">Gaji Pokok</th>
              <th className="pb-2.5 px-3">Tunjangan & Lembur</th>
              <th className="pb-2.5 px-3">Potongan</th>
              <th className="pb-2.5 px-3">Take Home Pay</th>
              <th className="pb-2.5 px-3 text-right">Aksi Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Memuat data slip gaji...
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground font-normal">
                  Belum ada slip gaji yang dipublikasikan untuk akun ini.
                </td>
              </tr>
            ) : (
              payslips.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 text-xs font-normal text-primary">
                    {p.payslip_number}
                  </td>
                  <td className="py-2.5 px-3 font-normal text-xs text-foreground">
                    {p.period?.name || 'Periode Bulanan'}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-normal text-muted-foreground">{formatRupiah(getBasicSalary(p))}</td>
                  <td className="py-2.5 px-3 text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                    +{formatRupiah(getAllowancesAndOt(p))}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-rose-600 dark:text-rose-400 font-normal">
                    -{formatRupiah(getTotalDeductions(p))}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-foreground text-xs">
                    {formatRupiah(getNetSalary(p))}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSlip(p)}
                      className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center space-x-1"
                    >
                      <Icon icon={ViewIcon} size={14} />
                      <span>Rincian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(p)}
                      disabled={isDownloading === p.id}
                      className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center space-x-1 shadow-xs"
                    >
                      <Icon icon={Download01Icon} size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full shadow-xl border border-border relative">
            <button
              type="button"
              onClick={() => setSelectedSlip(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
            >
              <Icon icon={Cancel01Icon} size={18} />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                ✓ Sah & Otorisasi HR
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">Rincian Slip Gaji Karyawan</h3>
            <p className="text-xs text-primary mb-5 font-normal">{selectedSlip.payslip_number}</p>

            <div className="space-y-4">
              {/* Earnings */}
              <div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Penghasilan & Tunjangan
                </div>
                <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Gaji Pokok</span>
                    <span className="font-normal text-foreground">
                      {formatRupiah(getBasicSalary(selectedSlip))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Tunjangan Tetap</span>
                    <span className="font-normal text-foreground">
                      {formatRupiah(selectedSlip.summary?.total_allowances ?? selectedSlip.total_allowances)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Upah Lembur (Depnaker)</span>
                    <span className="font-normal text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(selectedSlip.summary?.total_overtime_pay ?? selectedSlip.total_overtime_pay)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Potongan & Kewajiban
                </div>
                <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Potongan Keterlambatan</span>
                    <span className="font-normal text-rose-600 dark:text-rose-400">
                      -{formatRupiah(selectedSlip.summary?.late_deduction_amount ?? selectedSlip.late_deduction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Iuran BPJS Kesehatan</span>
                    <span className="font-normal text-rose-600 dark:text-rose-400">
                      -{formatRupiah(selectedSlip.summary?.bpjs_kesehatan ?? selectedSlip.bpjs_kesehatan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Iuran BPJS Ketenagakerjaan</span>
                    <span className="font-normal text-rose-600 dark:text-rose-400">
                      -{formatRupiah(selectedSlip.summary?.bpjs_ketenagakerjaan ?? selectedSlip.bpjs_ketenagakerjaan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-normal">Pajak PPh 21</span>
                    <span className="font-normal text-rose-600 dark:text-rose-400">
                      -{formatRupiah(selectedSlip.summary?.tax_pph21 ?? selectedSlip.tax_pph21)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Total */}
              <div className="p-3.5 rounded-xl bg-brand-dark text-white flex items-center justify-between border border-border">
                <div>
                  <div className="text-[10px] text-white/70 font-medium tracking-wider">TOTAL GAJI BERSIH (NET)</div>
                  <div className="text-lg font-semibold text-secondary">
                    {formatRupiah(getNetSalary(selectedSlip))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedSlip)}
                  className="px-3 py-1.5 rounded-lg bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors inline-flex items-center space-x-1.5 border border-border"
                >
                  <Icon icon={Download01Icon} size={14} />
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

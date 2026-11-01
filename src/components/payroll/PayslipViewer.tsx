import React, { useEffect, useState, useMemo } from 'react'
import { Cancel01Icon, Download01Icon, ViewIcon, CheckmarkCircle01Icon, File01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Pagination } from '../common/Pagination'
import { payrollService, API_BASE_URL } from '../../services/api'
import type { Payroll } from '../../types'
import { SkeletonBox } from '../ui/skeleton'

export const PayslipViewer: React.FC = () => {
  const [payslips, setPayslips] = useState<Payroll[]>([])
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDownloading, setIsDownloading] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const paginatedPayslips = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return payslips.slice(start, start + pageSize)
  }, [payslips, currentPage, pageSize])

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
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch {
      const token = localStorage.getItem('hris_token') || ''
      const downloadUrl = `${API_BASE_URL}/payrolls/${payroll.id}/download?token=${encodeURIComponent(token)}`
      window.open(downloadUrl, '_blank')
    } finally {
      setIsDownloading(null)
    }
  }

  const handleViewPdf = (payrollId: number) => {
    const token = localStorage.getItem('hris_token') || ''
    const viewUrl = `${API_BASE_URL}/payrolls/${payrollId}/download?mode=view&token=${encodeURIComponent(token)}`
    window.open(viewUrl, '_blank')
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

      {/* Payslips Container (Desktop Table + Mobile Cards) */}
      <div className="my-4 rounded-xl border border-border/80 bg-card overflow-hidden">
        {isLoading ? (
          <div>
            {/* Desktop Table Skeleton */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[760px]">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">No. Slip Gaji</th>
                    <th className="py-2.5 px-3">Periode Payroll</th>
                    <th className="py-2.5 px-3">Gaji Pokok</th>
                    <th className="py-2.5 px-3">Tunjangan & Lembur</th>
                    <th className="py-2.5 px-3">Potongan</th>
                    <th className="py-2.5 px-3">Take Home Pay</th>
                    <th className="py-2.5 px-3 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="80%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="75%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="65%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="60%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="60%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle"><SkeletonBox height={14} width="70%" radius={4} /></td>
                      <td className="py-2.5 px-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <SkeletonBox height={28} width={32} radius={6} />
                          <SkeletonBox height={28} width={32} radius={6} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="block sm:hidden divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <SkeletonBox height={14} width="65%" radius={4} />
                      <SkeletonBox height={11} width="45%" radius={4} />
                    </div>
                    <SkeletonBox height={20} width={70} radius={6} className="shrink-0" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <SkeletonBox height={11} width={80} radius={3} />
                      <SkeletonBox height={18} width={110} radius={4} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
                      <div className="space-y-1">
                        <SkeletonBox height={9} width="60%" radius={3} />
                        <SkeletonBox height={12} width="85%" radius={3} />
                      </div>
                      <div className="space-y-1">
                        <SkeletonBox height={9} width="60%" radius={3} />
                        <SkeletonBox height={12} width="85%" radius={3} />
                      </div>
                      <div className="space-y-1">
                        <SkeletonBox height={9} width="60%" radius={3} />
                        <SkeletonBox height={12} width="85%" radius={3} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SkeletonBox height={32} width="100%" radius={8} />
                    <SkeletonBox height={32} width="100%" radius={8} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-muted/70 text-muted-foreground flex items-center justify-center">
                <Icon icon={File01Icon} size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Belum Ada Slip Gaji</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto font-normal">
                  Belum ada slip gaji yang dipublikasikan oleh bagian HR untuk akun Anda.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed text-xs min-w-[760px]">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">No. Slip Gaji</th>
                    <th className="py-2.5 px-3">Periode Payroll</th>
                    <th className="py-2.5 px-3">Gaji Pokok</th>
                    <th className="py-2.5 px-3">Tunjangan & Lembur</th>
                    <th className="py-2.5 px-3">Potongan</th>
                    <th className="py-2.5 px-3">Take Home Pay</th>
                    <th className="py-2.5 px-3 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card text-xs">
                  {paginatedPayslips.map((p) => (
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
                          className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Icon icon={ViewIcon} size={14} />
                          <span>Rincian</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(p)}
                          disabled={isDownloading === p.id}
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Icon icon={Download01Icon} size={14} />
                          <span>{isDownloading === p.id ? 'Mengunduh...' : 'PDF'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-border">
              {paginatedPayslips.map((p) => (
                <div key={p.id} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium text-primary truncate">
                        {p.payslip_number}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {p.period?.name || 'Periode Bulanan'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium shrink-0">
                      <Icon icon={CheckmarkCircle01Icon} size={11} />
                      <span>Sah HR</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-muted-foreground uppercase font-medium">Take Home Pay</span>
                      <span className="text-base font-bold text-foreground font-mono">
                        {formatRupiah(getNetSalary(p))}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[11px]">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Pokok</div>
                        <div className="font-medium text-foreground truncate mt-0.5">
                          {formatRupiah(getBasicSalary(p))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Tunjangan</div>
                        <div className="font-medium text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                          +{formatRupiah(getAllowancesAndOt(p))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-medium">Potongan</div>
                        <div className="font-medium text-rose-600 dark:text-rose-400 truncate mt-0.5">
                          -{formatRupiah(getTotalDeductions(p))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSlip(p)}
                      className="w-full py-1.5 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/60 inline-flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Icon icon={ViewIcon} size={14} />
                      <span>Rincian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(p)}
                      disabled={isDownloading === p.id}
                      className="w-full py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Icon icon={Download01Icon} size={14} />
                      <span>{isDownloading === p.id ? 'Mengunduh...' : 'Unduh PDF'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={payslips.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        }}
      />

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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                <Icon icon={CheckmarkCircle01Icon} size={12} />
                <span>Sah & Otorisasi HR</span>
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
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleViewPdf(selectedSlip.id)}
                    className="px-3 py-1.5 rounded-lg bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors inline-flex items-center space-x-1.5 border border-border cursor-pointer"
                  >
                    <Icon icon={ViewIcon} size={14} />
                    <span>Lihat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedSlip)}
                    disabled={isDownloading === selectedSlip.id}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors inline-flex items-center space-x-1.5 border border-primary/20 cursor-pointer"
                  >
                    <Icon icon={Download01Icon} size={14} />
                    <span>{isDownloading === selectedSlip.id ? 'Mengunduh...' : 'Unduh PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

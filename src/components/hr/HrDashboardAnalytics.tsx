import React, { useState, useEffect, useMemo } from 'react'
import {
  Analytics01Icon,
  UserGroupIcon,
  DollarCircleIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Building01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import api from '../../services/api'
import type { Employee, Department, Attendance, PayrollPeriod } from '../../types'

interface HrDashboardAnalyticsProps {
  onNavigateTab: (tab: string) => void
}

export const HrDashboardAnalytics: React.FC<HrDashboardAnalyticsProps> = ({
  onNavigateTab,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [anomalies, setAnomalies] = useState<Attendance[]>([])
  const [, setPeriods] = useState<PayrollPeriod[]>([])
  const [, setLoading] = useState<boolean>(true)

  const loadDashboardData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      const [empRes, deptRes, anomRes, perRes] = await Promise.all([
        api.get('/employees?per_page=100'),
        api.get('/departments'),
        api.get(`/attendances/anomalies?date=${today}`),
        api.get('/payrolls/periods'),
      ])
      setEmployees(empRes.data?.data || [])
      setDepartments(deptRes.data?.data || [])
      setAnomalies(anomRes.data?.data || [])
      setPeriods(perRes.data?.data || [])
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const stats = useMemo(() => {
    const totalEmployees = employees.length
    const totalDepts = departments.length
    const totalAnomalies = anomalies.length

    const permanentCount = employees.filter((e) => e.employment_status === 'permanent').length
    const contractCount = employees.filter((e) => e.employment_status === 'contract').length
    const probationCount = employees.filter((e) => e.employment_status === 'probation').length
    const internCount = employees.filter((e) => e.employment_status === 'intern').length

    const deptDistribution = departments.map((d) => {
      const count = employees.filter((e) => e.department?.id === d.id).length
      const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
      return { id: d.id, name: d.name, code: d.code, count, percentage }
    })

    const estimatedPayroll = employees.reduce((acc, curr) => {
      const salary = curr.active_contract?.basic_salary || 0
      return acc + Number(salary)
    }, 0)

    return {
      totalEmployees,
      totalDepts,
      totalAnomalies,
      permanentCount,
      contractCount,
      probationCount,
      internCount,
      deptDistribution,
      estimatedPayroll,
    }
  }, [employees, departments, anomalies])

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Icon icon={Analytics01Icon} size={16} />
            <span>Executive HR Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Ringkasan Analitik SDM & Kepatuhan Organisasi
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Pusat kendali komprehensif untuk memantau produktivitas karyawan, kepatuhan batas toleransi presensi, struktur kontrak, dan proyeksi anggaran payroll.
          </p>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Icon icon={UserGroupIcon} size={16} className="text-indigo-600" />
            <span>Total Karyawan</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {stats.totalEmployees}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tersebar di {stats.totalDepts} departemen
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1.5">
            <Icon icon={DollarCircleIcon} size={16} />
            <span>Estimasi Beban Gaji</span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(stats.estimatedPayroll)}
          </div>
          <div className="text-xs text-indigo-700/80 mt-1">Proyeksi bulanan pokok</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1.5">
            <Icon icon={Clock01Icon} size={16} />
            <span>Kepatuhan Presensi</span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {stats.totalEmployees > 0
              ? Math.max(0, 100 - Math.round((stats.totalAnomalies / stats.totalEmployees) * 100))
              : 100}
            %
          </div>
          <div className="text-xs text-amber-700/80 mt-1">On-time & Geofence valid</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-1.5">
            <Icon icon={AlertCircleIcon} size={16} />
            <span>Anomali Hari Ini</span>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {stats.totalAnomalies}
          </div>
          <div className="text-xs text-rose-500 mt-1">Keterlambatan & absensi</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Distribusi Karyawan per Departemen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Komposisi tenaga kerja pada setiap divisi perusahaan.
              </p>
            </div>
            <span className="p-2 rounded-2xl bg-slate-50 text-slate-400">
              <Icon icon={Building01Icon} size={20} />
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {stats.deptDistribution.map((dept) => (
              <div key={dept.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{dept.name} ({dept.code})</span>
                  <span className="text-slate-500 font-mono">
                    {dept.count} orang ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Status Kepegawaian & Kontrak Kerja
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keseimbangan karyawan tetap PKWTT vs kontrak PKWT.
                </p>
              </div>
              <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon icon={CheckmarkCircle01Icon} size={20} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-[11px] font-bold text-emerald-700 uppercase">
                  Tetap (PKWTT)
                </div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {stats.permanentCount}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  {stats.totalEmployees > 0
                    ? Math.round((stats.permanentCount / stats.totalEmployees) * 100)
                    : 0}
                  % dari total
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="text-[11px] font-bold text-blue-700 uppercase">
                  Kontrak (PKWT)
                </div>
                <div className="text-2xl font-black text-blue-800 mt-1">
                  {stats.contractCount}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">
                  {stats.totalEmployees > 0
                    ? Math.round((stats.contractCount / stats.totalEmployees) * 100)
                    : 0}
                  % dari total
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="text-[11px] font-bold text-amber-700 uppercase">
                  Masa Percobaan
                </div>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {stats.probationCount}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">Probation 3 Bulan</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <div className="text-[11px] font-bold text-purple-700 uppercase">
                  Magang / Intern
                </div>
                <div className="text-2xl font-black text-purple-800 mt-1">
                  {stats.internCount}
                </div>
                <div className="text-[11px] text-purple-600 mt-0.5">Kampus Merdeka</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('hr-employees')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200/60 text-center"
            >
              + Kelola Karyawan
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('hr-anomalies')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200/60 text-center"
            >
              Audit Anomali
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('hr-payroll')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200/60 text-center"
            >
              Proses Payroll
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

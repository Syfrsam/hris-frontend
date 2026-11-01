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
import { Card, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { SkeletonBox } from '../ui/skeleton'

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
  const [loading, setLoading] = useState<boolean>(true)

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
      setEmployees(Array.isArray(empRes.data?.data) ? empRes.data.data : [])
      setDepartments(Array.isArray(deptRes.data?.data) ? deptRes.data.data : [])
      setAnomalies(Array.isArray(anomRes.data?.data) ? anomRes.data.data : [])
      setPeriods(Array.isArray(perRes.data?.data) ? perRes.data.data : [])
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
    const totalEmployees = Array.isArray(employees) ? employees.length : 0
    const totalDepts = Array.isArray(departments) ? departments.length : 0
    const totalAnomalies = Array.isArray(anomalies) ? anomalies.length : 0

    const validEmps = Array.isArray(employees) ? employees : []
    const permanentCount = validEmps.filter((e) => e.employment_status === 'permanent').length
    const contractCount = validEmps.filter((e) => e.employment_status === 'contract').length
    const probationCount = validEmps.filter((e) => e.employment_status === 'probation').length
    const internCount = validEmps.filter((e) => e.employment_status === 'intern').length

    const deptDistribution = (Array.isArray(departments) ? departments : []).map((d) => {
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

  if (loading) {
    return (
      <div className="space-y-5">
        {/* Header Banner Skeleton */}
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <SkeletonBox height={20} width={96} radius={6} />
            <SkeletonBox height={26} width={260} radius={8} />
            <SkeletonBox height={14} width={340} radius={4} />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <SkeletonBox height={15} width={15} radius={4} />
                <SkeletonBox height={12} width={70} radius={4} />
              </div>
              <SkeletonBox height={26} width={90} radius={6} className="mt-1" />
              <SkeletonBox height={12} width={110} radius={4} />
            </Card>
          ))}
        </div>

        {/* 2 Middle Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dept Distribution Skeleton */}
          <Card className="p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <SkeletonBox height={16} width={140} radius={4} />
                <SkeletonBox height={12} width={110} radius={4} />
              </div>
              <SkeletonBox height={28} width={28} radius={8} />
            </div>

            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <SkeletonBox height={13} width={120} radius={4} />
                    <SkeletonBox height={13} width={60} radius={4} />
                  </div>
                  <SkeletonBox height={8} width="100%" radius={4} />
                </div>
              ))}
            </div>
          </Card>

          {/* Contract Status Skeleton */}
          <Card className="p-5 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1.5">
                  <SkeletonBox height={16} width={140} radius={4} />
                  <SkeletonBox height={12} width={130} radius={4} />
                </div>
                <SkeletonBox height={28} width={28} radius={8} />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <SkeletonBox height={11} width={80} radius={3} />
                    <SkeletonBox height={22} width={45} radius={6} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex gap-2">
              <SkeletonBox height={30} width="33%" radius={8} />
              <SkeletonBox height={30} width="33%" radius={8} />
              <SkeletonBox height={30} width="33%" radius={8} />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header Banner - Concise & Direct */}
      <div className="bg-primary text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium uppercase mb-2">
            <Icon icon={Analytics01Icon} size={13} className="mr-1" />
            Ringkasan SDM
          </Badge>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Dashboard Analitik & Kepatuhan
          </h2>
          <p className="text-white/80 text-xs mt-1 font-normal">
            Pantau kehadiran, kontrak kerja, dan proyeksi anggaran gaji.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center space-x-1.5">
            <Icon icon={UserGroupIcon} size={15} className="text-primary" />
            <span>Karyawan</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {stats.totalEmployees}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
            {stats.totalDepts} Departemen
          </div>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="text-[11px] font-medium text-primary uppercase flex items-center space-x-1.5">
            <Icon icon={DollarCircleIcon} size={15} />
            <span>Estimasi Gaji</span>
          </div>
          <div className="text-base font-semibold text-foreground mt-1">
            {formatRupiah(stats.estimatedPayroll)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Gaji pokok bulanan</div>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center space-x-1.5">
            <Icon icon={Clock01Icon} size={15} className="text-emerald-500" />
            <span>Kepatuhan Jam</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {stats.totalEmployees > 0
              ? Math.max(0, 100 - Math.round((stats.totalAnomalies / stats.totalEmployees) * 100))
              : 100}
            %
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Tepat waktu & GPS</div>
        </Card>

        <Card className={`p-4 rounded-xl ${
          stats.totalAnomalies > 0 ? 'bg-rose-500/10 border-rose-500/20' : ''
        }`}>
          <div className={`text-[11px] font-medium uppercase flex items-center space-x-1.5 ${
            stats.totalAnomalies > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
          }`}>
            <Icon icon={AlertCircleIcon} size={15} className={stats.totalAnomalies > 0 ? 'text-rose-500' : ''} />
            <span>Anomali Hari Ini</span>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1">
            {stats.totalAnomalies}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">Terlambat & absen</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dept Distribution */}
        <Card className="p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Distribusi Departemen
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-normal">
                Jumlah staf per divisi
              </CardDescription>
            </div>
            <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">
              <Icon icon={Building01Icon} size={18} />
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {stats.deptDistribution.map((dept) => (
              <div key={dept.id} className="space-y-1">
                <div className="flex justify-between text-xs font-normal">
                  <span className="text-foreground">{dept.name} ({dept.code})</span>
                  <span className="text-muted-foreground font-medium">
                    {dept.count} ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-sm transition-all duration-500"
                    style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Contract Status */}
        <Card className="p-5 rounded-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Status Kontrak Kerja
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-normal">
                  Komposisi status kepegawaian
                </CardDescription>
              </div>
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Icon icon={CheckmarkCircle01Icon} size={18} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-[10px] font-medium text-primary uppercase">
                  Tetap (PKWTT)
                </div>
                <div className="text-lg font-semibold text-foreground mt-0.5">
                  {stats.permanentCount}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  Kontrak (PKWT)
                </div>
                <div className="text-lg font-semibold text-foreground mt-0.5">
                  {stats.contractCount}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/20 border border-secondary/40">
                <div className="text-[10px] font-medium text-foreground uppercase">
                  Probation
                </div>
                <div className="text-lg font-semibold text-foreground mt-0.5">
                  {stats.probationCount}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  Magang
                </div>
                <div className="text-lg font-semibold text-muted-foreground mt-0.5">
                  {stats.internCount}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('hr-employees')}
              className="flex-1 py-1.5 px-2.5 bg-muted hover:bg-primary/10 hover:text-primary text-foreground font-normal rounded-lg text-xs transition-colors border border-border text-center"
            >
              Karyawan
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('hr-anomalies')}
              className="flex-1 py-1.5 px-2.5 bg-muted hover:bg-primary/10 hover:text-primary text-foreground font-normal rounded-lg text-xs transition-colors border border-border text-center"
            >
              Anomali
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('hr-payroll')}
              className="flex-1 py-1.5 px-2.5 bg-muted hover:bg-primary/10 hover:text-primary text-foreground font-normal rounded-lg text-xs transition-colors border border-border text-center"
            >
              Payroll
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

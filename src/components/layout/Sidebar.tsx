import React from 'react'
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  DollarCircleIcon,
  File01Icon,
  UserGroupIcon,
  Analytics01Icon,
  Building01Icon,
  AlertCircleIcon,
  Invoice01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

export type TabKey =
  | 'attendance'
  | 'leaves'
  | 'overtime'
  | 'payroll'
  | 'team-attendance'
  | 'approvals'
  | 'hr-analytics'
  | 'hr-employees'
  | 'hr-anomalies'
  | 'hr-payroll'

interface SidebarProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user } = useAuth()

  const isManager = user?.roles?.some((r) =>
    ['Manager', 'HR Manager', 'Superadmin'].includes(r)
  )

  const isHr = user?.roles?.some((r) =>
    ['HR Staff', 'HR Manager', 'Superadmin'].includes(r)
  )

  const essMenuItems: { id: TabKey; label: string; icon: any }[] = [
    {
      id: 'attendance',
      label: 'Presensi & GPS',
      icon: Clock01Icon,
    },
    {
      id: 'leaves',
      label: 'Cuti & Izin Sakit',
      icon: Calendar03Icon,
    },
    {
      id: 'overtime',
      label: 'Lembur Kerja',
      icon: File01Icon,
    },
    {
      id: 'payroll',
      label: 'Slip Gaji Digital',
      icon: DollarCircleIcon,
    },
  ]

  const hrMenuItems: { id: TabKey; label: string; icon: any }[] = [
    {
      id: 'hr-analytics',
      label: 'Dashboard HR',
      icon: Analytics01Icon,
    },
    {
      id: 'hr-employees',
      label: 'Kelola Karyawan',
      icon: Building01Icon,
    },
    {
      id: 'hr-anomalies',
      label: 'Audit Anomali',
      icon: AlertCircleIcon,
    },
    {
      id: 'hr-payroll',
      label: 'Engine Payroll',
      icon: Invoice01Icon,
    },
  ]

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
            Mandiri Karyawan (ESS)
          </div>
          <nav className="space-y-1">
            {essMenuItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon icon={item.icon} size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {isManager && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
              Portal Manajer Tim
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectTab('team-attendance')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
                  activeTab === 'team-attendance'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon icon={UserGroupIcon} size={18} />
                  <span>Presensi Tim</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('approvals')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
                  activeTab === 'approvals'
                    ? 'bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-md shadow-indigo-700/25'
                    : 'text-slate-700 hover:text-indigo-900 hover:bg-indigo-50/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon icon={CheckmarkCircle01Icon} size={18} className="text-indigo-500" />
                  <span>Persetujuan Tim</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Review
                </span>
              </button>
            </nav>
          </div>
        )}

        {isHr && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider px-3 mb-2.5 flex items-center justify-between">
              <span>Administrasi HR</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black">
                {user?.roles?.[0]}
              </span>
            </div>
            <nav className="space-y-1">
              {hrMenuItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon icon={item.icon} size={18} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
        <div className="font-semibold text-slate-700 flex items-center space-x-1.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>HRIS Enterprise Ready</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Sprint #1-7 Selesai: GPS Geofence, Depnaker Overtime, DomPDF Engine & Role Security.
        </p>
      </div>
    </aside>
  )
}

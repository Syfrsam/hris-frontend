import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Location01Icon,
  Settings01Icon,
  Logout01Icon,
  Cancel01Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../ui/badge'

export type TabKey =
  | 'superadmin-users'
  | 'superadmin-penalties'
  | 'superadmin-leave-types'
  | 'superadmin-shifts'
  | 'attendance'
  | 'leaves'
  | 'overtime'
  | 'payroll'
  | 'team-attendance'
  | 'approvals'
  | 'hr-analytics'
  | 'hr-employees'
  | 'hr-branches'
  | 'hr-anomalies'
  | 'hr-payroll'
  | 'settings'

interface SidebarProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isSuperadmin = Boolean(user?.roles?.includes('Superadmin'))

  const isManager =
    isSuperadmin ||
    Boolean(user?.roles?.some((r) => ['Manager', 'HR Manager'].includes(r)))

  const isHr =
    isSuperadmin ||
    Boolean(user?.roles?.some((r) => ['HR Staff', 'HR Manager'].includes(r)))

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
      id: 'hr-branches',
      label: 'Lokasi Kantor & GPS',
      icon: Location01Icon,
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

  const handleTabClick = (tab: TabKey) => {
    onSelectTab(tab)
    if (onClose) onClose()
  }

  const handleSettingsClick = () => {
    onSelectTab('settings')
    if (onClose) onClose()
  }

  const navigate = useNavigate()

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    if (onClose) onClose()
    logout()
    navigate('/login', { replace: true })
    toast.success(
      'Berhasil Keluar',
      'Anda telah berhasil keluar dari akun HRIS Enterprise.'
    )
  }

  const renderMenuItems = () => (
    <div className="space-y-3">
      {/* Superadmin Section */}
      {isSuperadmin && (
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
            <span>Superadmin</span>
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleTabClick('superadmin-users')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'superadmin-users'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={SecurityCheckIcon} size={16} />
                <span>Kelola User & Role</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('superadmin-penalties')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'superadmin-penalties'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={AlertCircleIcon} size={16} />
                <span>Peraturan Denda</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('superadmin-leave-types')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'superadmin-leave-types'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={Calendar03Icon} size={16} />
                <span>Kelola Jenis Cuti</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('superadmin-shifts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'superadmin-shifts'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={Clock01Icon} size={16} />
                <span>Jadwal Shift & Jam Kerja</span>
              </div>
            </button>
          </nav>
        </div>
      )}

      {/* HR Administration Section */}
      {isHr && (
        <div className={isSuperadmin ? 'pt-2.5 border-t border-border' : ''}>
          <div className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
            <span>Administrasi HR</span>
          </div>
          <nav className="space-y-0.5">
            {hrMenuItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon icon={item.icon} size={16} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* Manager Section */}
      {isManager && (
        <div className="pt-2.5 border-t border-border">
          <div className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider px-3 mb-1.5">
            Portal Manajer Tim
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleTabClick('team-attendance')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'team-attendance'
                  ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={UserGroupIcon} size={16} />
                <span>Presensi Tim</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('approvals')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                activeTab === 'approvals'
                  ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon icon={CheckmarkCircle01Icon} size={16} />
                <span>Persetujuan Tim</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-semibold">
                Review
              </Badge>
            </button>
          </nav>
        </div>
      )}

      {/* ESS Menu Section */}
      <div className="pt-2.5 border-t border-border">
        <div className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider px-3 mb-1.5">
          Mandiri Karyawan (ESS)
        </div>
        <nav className="space-y-0.5">
          {essMenuItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon icon={item.icon} size={16} />
                  <span>{item.label}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )

  const renderFixedFooter = () => (
    <div className="shrink-0 p-3 border-t border-border bg-card/95 backdrop-blur-xs space-y-0.5">
      <button
        type="button"
        onClick={handleSettingsClick}
        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
          activeTab === 'settings'
            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
        }`}
      >
        <Icon icon={Settings01Icon} size={16} />
        <span>Pengaturan Akun</span>
      </button>

      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 transition-colors cursor-pointer"
      >
        <Icon icon={Logout01Icon} size={16} className="text-rose-600 dark:text-rose-400" />
        <span>Keluar</span>
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar: Fixed layout with scrollable menu & fixed bottom buttons */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-card border-r border-border flex-col justify-between shrink-0 transition-colors md:sticky md:top-16 md:h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2.5">
          {renderMenuItems()}
        </div>
        {renderFixedFooter()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-dark/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-over Drawer: Fixed layout with scrollable menu & fixed bottom buttons */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-label="Menu Navigasi Mobile"
      >
        {/* Mobile Header with Brand & Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs">
              <Icon icon={Building01Icon} size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground leading-tight">HRIS Enterprise</div>
              <div className="text-[10px] text-muted-foreground font-normal">Head Office Jakarta</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup menu"
          >
            <Icon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderMenuItems()}
        </div>

        {/* Fixed Footer */}
        {renderFixedFooter()}
      </aside>

      {/* Logout Warning Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
              <Icon icon={AlertCircleIcon} size={24} />
            </div>

            <div>
              <h3
                id="logout-confirm-title"
                className="text-base font-semibold text-foreground"
              >
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">
                Apakah Anda yakin ingin keluar dari sistem HRIS Enterprise? Sesi aktif Anda akan diakhiri.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

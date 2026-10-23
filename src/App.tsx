import React, { Suspense, lazy, useState } from 'react'
import { AttendanceHistory } from './components/attendance/AttendanceHistory'
import { AttendanceWidget } from './components/attendance/AttendanceWidget'
import { LoginCard } from './components/auth/LoginCard'
import { Navbar } from './components/layout/Navbar'
import { Sidebar, type TabKey } from './components/layout/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

const UserRoleManagement = lazy(() =>
  import('./components/admin/UserRoleManagement').then((m) => ({ default: m.UserRoleManagement }))
)
const LeaveManagement = lazy(() =>
  import('./components/leave/LeaveManagement').then((m) => ({ default: m.LeaveManagement }))
)
const OvertimeManagement = lazy(() =>
  import('./components/overtime/OvertimeManagement').then((m) => ({ default: m.OvertimeManagement }))
)
const PayslipViewer = lazy(() =>
  import('./components/payroll/PayslipViewer').then((m) => ({ default: m.PayslipViewer }))
)
const TeamAttendance = lazy(() =>
  import('./components/manager/TeamAttendance').then((m) => ({ default: m.TeamAttendance }))
)
const ApprovalPanel = lazy(() =>
  import('./components/approvals/ApprovalPanel').then((m) => ({ default: m.ApprovalPanel }))
)
const HrDashboardAnalytics = lazy(() =>
  import('./components/hr/HrDashboardAnalytics').then((m) => ({ default: m.HrDashboardAnalytics }))
)
const EmployeeManagement = lazy(() =>
  import('./components/hr/EmployeeManagement').then((m) => ({ default: m.EmployeeManagement }))
)
const BranchManagement = lazy(() =>
  import('./components/hr/BranchManagement').then((m) => ({ default: m.BranchManagement }))
)
const AttendanceAudit = lazy(() =>
  import('./components/hr/AttendanceAudit').then((m) => ({ default: m.AttendanceAudit }))
)
const PayrollManagement = lazy(() =>
  import('./components/hr/PayrollManagement').then((m) => ({ default: m.PayrollManagement }))
)

const MainDashboard: React.FC = () => {
  const { user, token, isLoading } = useAuth()
  const isSuperadmin = Boolean(user?.roles?.includes('Superadmin'))
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    user?.roles?.includes('Superadmin') ? 'superadmin-users' : 'attendance'
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide text-white/80">
          Memuat Sesi HRIS Enterprise...
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return <LoginCard />
  }

  const effectiveTab: TabKey =
    !isSuperadmin && activeTab === 'superadmin-users' ? 'attendance' : activeTab

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={effectiveTab}
          onSelectTab={handleSelectTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {effectiveTab === 'attendance' && (
            <div>
              <AttendanceWidget />
              <AttendanceHistory />
            </div>
          )}

          <Suspense
            fallback={
              <div className="p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            {effectiveTab === 'superadmin-users' && <UserRoleManagement />}

            {effectiveTab === 'leaves' && <LeaveManagement />}

            {effectiveTab === 'overtime' && <OvertimeManagement />}

            {effectiveTab === 'payroll' && <PayslipViewer />}

            {effectiveTab === 'team-attendance' && <TeamAttendance />}

            {effectiveTab === 'approvals' && <ApprovalPanel />}

            {effectiveTab === 'hr-analytics' && (
              <HrDashboardAnalytics onNavigateTab={(tab) => setActiveTab(tab as TabKey)} />
            )}

            {effectiveTab === 'hr-employees' && <EmployeeManagement />}

            {effectiveTab === 'hr-branches' && <BranchManagement />}

            {effectiveTab === 'hr-anomalies' && <AttendanceAudit />}

            {effectiveTab === 'hr-payroll' && <PayrollManagement />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainDashboard />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

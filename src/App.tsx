import React, { useState } from 'react'
import { AttendanceHistory } from './components/attendance/AttendanceHistory'
import { AttendanceWidget } from './components/attendance/AttendanceWidget'
import { ApprovalPanel } from './components/approvals/ApprovalPanel'
import { LoginCard } from './components/auth/LoginCard'
import { Navbar } from './components/layout/Navbar'
import { Sidebar, type TabKey } from './components/layout/Sidebar'
import { LeaveManagement } from './components/leave/LeaveManagement'
import { OvertimeManagement } from './components/overtime/OvertimeManagement'
import { PayslipViewer } from './components/payroll/PayslipViewer'
import { TeamAttendance } from './components/manager/TeamAttendance'
import { EmployeeManagement } from './components/hr/EmployeeManagement'
import { BranchManagement } from './components/hr/BranchManagement'
import { AttendanceAudit } from './components/hr/AttendanceAudit'
import { PayrollManagement } from './components/hr/PayrollManagement'
import { HrDashboardAnalytics } from './components/hr/HrDashboardAnalytics'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

const MainDashboard: React.FC = () => {
  const { user, token, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('attendance')
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
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'attendance' && (
            <div>
              <AttendanceWidget />
              <AttendanceHistory />
            </div>
          )}

          {activeTab === 'leaves' && <LeaveManagement />}

          {activeTab === 'overtime' && <OvertimeManagement />}

          {activeTab === 'payroll' && <PayslipViewer />}

          {activeTab === 'team-attendance' && <TeamAttendance />}

          {activeTab === 'approvals' && <ApprovalPanel />}

          {activeTab === 'hr-analytics' && (
            <HrDashboardAnalytics onNavigateTab={(tab) => setActiveTab(tab as TabKey)} />
          )}

          {activeTab === 'hr-employees' && <EmployeeManagement />}

          {activeTab === 'hr-branches' && <BranchManagement />}

          {activeTab === 'hr-anomalies' && <AttendanceAudit />}

          {activeTab === 'hr-payroll' && <PayrollManagement />}
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

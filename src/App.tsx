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
import { AttendanceAudit } from './components/hr/AttendanceAudit'
import { PayrollManagement } from './components/hr/PayrollManagement'
import { HrDashboardAnalytics } from './components/hr/HrDashboardAnalytics'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

const MainDashboard: React.FC = () => {
  const { user, token, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('attendance')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide text-slate-300">
          Memuat Sesi HRIS Enterprise...
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <LoginCard />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
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

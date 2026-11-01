import React, { Suspense, lazy, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import { AttendanceHistory } from './components/attendance/AttendanceHistory'
import { AttendanceWidget } from './components/attendance/AttendanceWidget'
import { LoginCard } from './components/auth/LoginCard'
import { Navbar } from './components/layout/Navbar'
import { Sidebar, type TabKey } from './components/layout/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { SkulletProvider } from 'skullet/react'

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
const AccountSettings = lazy(() =>
  import('./components/settings/AccountSettings').then((m) => ({ default: m.AccountSettings }))
)
const PenaltySettings = lazy(() =>
  import('./components/admin/PenaltySettings').then((m) => ({ default: m.PenaltySettings }))
)
const LeaveTypeSettings = lazy(() =>
  import('./components/admin/LeaveTypeSettings').then((m) => ({ default: m.LeaveTypeSettings }))
)
const ShiftSettings = lazy(() =>
  import('./components/admin/ShiftSettings').then((m) => ({ default: m.ShiftSettings }))
)

export const TAB_ROUTES: Record<TabKey, string> = {
  'superadmin-users': '/kelola-user',
  'superadmin-penalties': '/peraturan-denda',
  'superadmin-leave-types': '/kelola-jenis-cuti',
  'superadmin-shifts': '/jadwal-shift',
  'attendance': '/presensi',
  'leaves': '/cuti',
  'overtime': '/lembur',
  'payroll': '/slip-gaji',
  'team-attendance': '/presensi-tim',
  'approvals': '/persetujuan',
  'hr-analytics': '/dashboard-hr',
  'hr-employees': '/kelola-karyawan',
  'hr-branches': '/lokasi-kantor',
  'hr-anomalies': '/audit-anomali',
  'hr-payroll': '/payroll',
  'settings': '/pengaturan',
}

export const ROUTE_TO_TAB: Record<string, TabKey> = {
  '/kelola-user': 'superadmin-users',
  '/superadmin/users': 'superadmin-users',
  '/superadmin-users': 'superadmin-users',
  '/admin/users': 'superadmin-users',

  '/peraturan-denda': 'superadmin-penalties',
  '/superadmin/peraturan-denda': 'superadmin-penalties',
  '/superadmin-penalties': 'superadmin-penalties',
  '/aturan-denda': 'superadmin-penalties',

  '/kelola-jenis-cuti': 'superadmin-leave-types',
  '/superadmin/jenis-cuti': 'superadmin-leave-types',
  '/superadmin-leave-types': 'superadmin-leave-types',
  '/jenis-cuti': 'superadmin-leave-types',

  '/jadwal-shift': 'superadmin-shifts',
  '/superadmin/shifts': 'superadmin-shifts',
  '/superadmin-shifts': 'superadmin-shifts',
  '/shifts': 'superadmin-shifts',

  '/presensi': 'attendance',
  '/attendance': 'attendance',
  '/dashboard': 'attendance',

  '/cuti': 'leaves',
  '/leaves': 'leaves',

  '/lembur': 'overtime',
  '/overtime': 'overtime',

  '/slip-gaji': 'payroll',
  '/payroll-slip': 'payroll',

  '/presensi-tim': 'team-attendance',
  '/tim/presensi': 'team-attendance',
  '/team-attendance': 'team-attendance',

  '/persetujuan': 'approvals',
  '/tim/persetujuan': 'approvals',
  '/approvals': 'approvals',

  '/dashboard-hr': 'hr-analytics',
  '/hr/dashboard': 'hr-analytics',
  '/hr-analytics': 'hr-analytics',

  '/kelola-karyawan': 'hr-employees',
  '/hr/karyawan': 'hr-employees',
  '/hr-employees': 'hr-employees',

  '/lokasi-kantor': 'hr-branches',
  '/hr/cabang': 'hr-branches',
  '/hr-branches': 'hr-branches',

  '/audit-anomali': 'hr-anomalies',
  '/hr/audit': 'hr-anomalies',
  '/hr-anomalies': 'hr-anomalies',

  '/payroll': 'hr-payroll',
  '/payroll-engine': 'hr-payroll',
  '/hr/payroll': 'hr-payroll',
  '/hr-payroll': 'hr-payroll',

  '/pengaturan': 'settings',
  '/settings': 'settings',
  '/profil': 'settings',
  '/profile': 'settings',
}

const MainDashboard: React.FC = () => {
  const { user, token, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isSuperadmin = Boolean(user?.roles?.includes('Superadmin'))
  const isHr = Boolean(user?.roles?.some((r) => ['HR Staff', 'HR Manager', 'Superadmin'].includes(r)))
  const isManager = Boolean(
    user?.roles?.some((r) => ['Manager', 'HR Manager', 'Superadmin'].includes(r))
  )

  const defaultRoute = isSuperadmin
    ? '/kelola-user'
    : isHr
    ? '/dashboard-hr'
    : '/presensi'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token || !user) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />
    }
    return <LoginCard />
  }

  if (location.pathname === '/login') {
    return <Navigate to={defaultRoute} replace />
  }

  const currentTab: TabKey = ROUTE_TO_TAB[location.pathname] || (
    isSuperadmin ? 'superadmin-users' : 'attendance'
  )

  const effectiveTab: TabKey =
    !isSuperadmin && currentTab === 'superadmin-users' ? 'attendance' : currentTab

  const handleSelectTab = (tab: TabKey) => {
    const targetRoute = TAB_ROUTES[tab] || '/presensi'
    navigate(targetRoute)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onNavigateSettings={() => handleSelectTab('settings')}
      />
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        <Sidebar
          activeTab={effectiveTab}
          onSelectTab={handleSelectTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="p-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
            <Routes>
              {/* Default redirect based on user role */}
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              <Route path="/login" element={<Navigate to={defaultRoute} replace />} />

              {/* ESS Routes (All users) */}
              <Route
                path="/presensi"
                element={
                  <div>
                    <AttendanceWidget />
                    <AttendanceHistory />
                  </div>
                }
              />
              <Route path="/attendance" element={<Navigate to="/presensi" replace />} />
              <Route path="/dashboard" element={<Navigate to="/presensi" replace />} />

              <Route path="/cuti" element={<LeaveManagement />} />
              <Route path="/leaves" element={<Navigate to="/cuti" replace />} />

              <Route path="/lembur" element={<OvertimeManagement />} />
              <Route path="/overtime" element={<Navigate to="/lembur" replace />} />

              <Route path="/slip-gaji" element={<PayslipViewer />} />
              <Route path="/payroll-slip" element={<Navigate to="/slip-gaji" replace />} />

              {/* Manager Routes */}
              <Route
                path="/presensi-tim"
                element={isManager ? <TeamAttendance /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/tim/presensi" element={<Navigate to="/presensi-tim" replace />} />
              <Route path="/team-attendance" element={<Navigate to="/presensi-tim" replace />} />

              <Route
                path="/persetujuan"
                element={isManager ? <ApprovalPanel /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/tim/persetujuan" element={<Navigate to="/persetujuan" replace />} />
              <Route path="/approvals" element={<Navigate to="/persetujuan" replace />} />

              {/* HR Routes */}
              <Route
                path="/dashboard-hr"
                element={
                  isHr ? (
                    <HrDashboardAnalytics onNavigateTab={(tab) => handleSelectTab(tab as TabKey)} />
                  ) : (
                    <Navigate to="/presensi" replace />
                  )
                }
              />
              <Route path="/hr/dashboard" element={<Navigate to="/dashboard-hr" replace />} />
              <Route path="/hr-analytics" element={<Navigate to="/dashboard-hr" replace />} />

              <Route
                path="/kelola-karyawan"
                element={isHr ? <EmployeeManagement /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/hr/karyawan" element={<Navigate to="/kelola-karyawan" replace />} />
              <Route path="/hr-employees" element={<Navigate to="/kelola-karyawan" replace />} />

              <Route
                path="/lokasi-kantor"
                element={isHr ? <BranchManagement /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/hr/cabang" element={<Navigate to="/lokasi-kantor" replace />} />
              <Route path="/hr-branches" element={<Navigate to="/lokasi-kantor" replace />} />

              <Route
                path="/audit-anomali"
                element={isHr ? <AttendanceAudit /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/hr/audit" element={<Navigate to="/audit-anomali" replace />} />
              <Route path="/hr-anomalies" element={<Navigate to="/audit-anomali" replace />} />

              <Route
                path="/payroll"
                element={isHr ? <PayrollManagement /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/payroll-engine" element={<Navigate to="/payroll" replace />} />
              <Route path="/hr/payroll" element={<Navigate to="/payroll" replace />} />
              <Route path="/hr-payroll" element={<Navigate to="/payroll" replace />} />

              {/* Superadmin Route */}
              <Route
                path="/kelola-user"
                element={isSuperadmin ? <UserRoleManagement /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/superadmin/users" element={<Navigate to="/kelola-user" replace />} />
              <Route path="/superadmin-users" element={<Navigate to="/kelola-user" replace />} />
              <Route path="/admin/users" element={<Navigate to="/kelola-user" replace />} />

              <Route
                path="/peraturan-denda"
                element={isSuperadmin ? <PenaltySettings /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/superadmin/peraturan-denda" element={<Navigate to="/peraturan-denda" replace />} />
              <Route path="/superadmin-penalties" element={<Navigate to="/peraturan-denda" replace />} />
              <Route path="/aturan-denda" element={<Navigate to="/peraturan-denda" replace />} />

              <Route
                path="/kelola-jenis-cuti"
                element={isSuperadmin ? <LeaveTypeSettings /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/superadmin/jenis-cuti" element={<Navigate to="/kelola-jenis-cuti" replace />} />
              <Route path="/superadmin-leave-types" element={<Navigate to="/kelola-jenis-cuti" replace />} />
              <Route path="/jenis-cuti" element={<Navigate to="/kelola-jenis-cuti" replace />} />

              <Route
                path="/jadwal-shift"
                element={isSuperadmin || isHr ? <ShiftSettings /> : <Navigate to="/presensi" replace />}
              />
              <Route path="/superadmin/shifts" element={<Navigate to="/jadwal-shift" replace />} />
              <Route path="/superadmin-shifts" element={<Navigate to="/jadwal-shift" replace />} />
              <Route path="/shifts" element={<Navigate to="/jadwal-shift" replace />} />

              {/* Account Settings (All users) */}
              <Route path="/pengaturan" element={<AccountSettings />} />
              <Route path="/settings" element={<Navigate to="/pengaturan" replace />} />
              <Route path="/profil" element={<Navigate to="/pengaturan" replace />} />
              <Route path="/profile" element={<Navigate to="/pengaturan" replace />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SkulletProvider reveal="smart" mode="system">
            <MainDashboard />
          </SkulletProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

export type Role = 'Superadmin' | 'HR Manager' | 'HR Staff' | 'Manager' | 'Employee'

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  roles: Role[]
  avatar_url?: string | null
}

export interface Department {
  id: number
  code: string
  name: string
}

export interface JobPosition {
  id: number
  code: string
  title: string
  department_id?: number
}

export interface Branch {
  id: number
  code: string
  name: string
  address?: string
  latitude: number
  longitude: number
  radius_meters: number
}

export interface Employee {
  id: number
  user_id: number
  nik: string
  ktp_number: string
  gender: 'male' | 'female'
  birth_date: string
  employment_status: string
  join_date: string
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_holder?: string | null
  user: User
  department?: Department
  job_position?: JobPosition
  branch?: Branch
  manager?: {
    id: number
    nik: string
    name: string
  }
  active_contract?: {
    contract_number: string
    contract_type: 'pkwt' | 'pkwtt' | 'internship'
    basic_salary: number
    document_url?: string | null
  }
}

export interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  late_tolerance_minutes: number
}

export interface ClockDetails {
  time?: string | null
  datetime?: string | null
  distance_meters?: number | null
  photo_url?: string | null
}

export interface Attendance {
  id: number
  employee_id: number
  shift_id?: number
  date: string
  clock_in: ClockDetails | string | null
  clock_out: ClockDetails | string | null
  clock_in_latitude?: number | null
  clock_in_longitude?: number | null
  status: 'present' | 'late' | 'half_day' | 'absent'
  late_minutes: number
  work_duration_minutes: number
  shift?: Shift
  employee?: Employee
}

export interface LeaveType {
  id: number
  name: string
  code: string
  default_quota: number
  requires_attachment: boolean
  min_notice_days: number
}

export interface LeaveBalance {
  id: number
  leave_type_id: number
  year: number
  initial_quota: number
  used_quota: number
  remaining_quota: number
  leave_type?: LeaveType
}

export interface ApprovalRecord {
  id: number
  stage: 'manager' | 'hr'
  reviewer_id: number
  status: 'approved' | 'rejected'
  notes?: string | null
  action_at: string
  reviewer?: {
    id: number
    name: string
  }
}

export interface LeaveRequest {
  id: number
  request_number: string
  leave_type_id: number
  start_date: string
  end_date: string
  total_days: number
  reason: string
  attachment_path?: string | null
  status: 'pending' | 'approved' | 'rejected'
  current_step: 'manager' | 'hr'
  leave_type?: LeaveType
  approvals?: ApprovalRecord[]
  employee?: Employee
}

export interface OvertimeRequest {
  id: number
  request_number: string
  date: string
  start_time: string
  end_time: string
  duration_hours: number
  task_description: string
  rate_multiplier: number
  status: 'pending' | 'approved' | 'rejected'
  current_step: 'manager' | 'hr'
  approvals?: ApprovalRecord[]
  employee?: Employee
}

export interface PayrollSummary {
  basic_salary: number
  total_allowances: number
  total_overtime_pay: number
  gross_salary?: number
  late_deduction_amount: number
  bpjs_kesehatan: number
  bpjs_ketenagakerjaan: number
  tax_pph21: number
  total_deductions: number
  net_salary: number
}

export interface PayrollPeriod {
  id: number
  name: string
  start_date: string
  cutoff_date: string
  payment_date: string
  status: 'draft' | 'authorized' | 'paid'
  total_payrolls?: number
  total_net_amount?: number
  created_at?: string
}

export interface Payroll {
  id: number
  payslip_number: string
  employee_id?: number
  employee?: Employee
  basic_salary?: number
  total_allowances?: number
  total_overtime_pay?: number
  total_deductions?: number
  late_deduction_amount?: number
  bpjs_kesehatan?: number
  bpjs_ketenagakerjaan?: number
  tax_pph21?: number
  net_salary?: number
  summary?: PayrollSummary
  status: 'draft' | 'authorized' | 'published'
  period?: {
    id: number
    name: string
    start_date: string
    cutoff_date: string
    payment_date: string
  }
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

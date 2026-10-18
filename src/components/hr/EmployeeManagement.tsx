import React, { useState, useEffect, useMemo } from 'react'
import {
  UserGroupIcon,
  UserAdd01Icon,
  Search01Icon,
  Building01Icon,
  EyeIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import type { Employee, Department, JobPosition } from '../../types'

export const EmployeeManagement: React.FC = () => {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [search, setSearch] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password',
    phone: '',
    role: 'Employee',
    branch_id: 1,
    department_id: '',
    job_position_id: '',
    nik: '',
    ktp_number: '',
    gender: 'male',
    birth_date: '1995-01-01',
    birth_place: 'Jakarta',
    marital_status: 'single',
    dependents_count: 0,
    bank_name: 'BCA',
    bank_account_number: '',
    bank_account_holder: '',
    employment_status: 'permanent',
    join_date: new Date().toISOString().split('T')[0],
    basic_salary: 8000000,
    contract_type: 'pkwtt',
    contract_number: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        api.get('/employees?per_page=50'),
        api.get('/departments'),
        api.get('/job-positions'),
      ])
      setEmployees(empRes.data?.data || [])
      setDepartments(deptRes.data?.data || [])
      setPositions(posRes.data?.data || [])
    } catch (err) {
      console.error('Error loading employee master data:', err)
      toast.error('Gagal Memuat Data', 'Tidak dapat memuat master data karyawan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = emp.user?.name?.toLowerCase() || ''
      const email = emp.user?.email?.toLowerCase() || ''
      const nik = emp.nik?.toLowerCase() || ''
      const q = search.toLowerCase()

      const matchSearch = name.includes(q) || email.includes(q) || nik.includes(q)
      const matchDept =
        selectedDept === 'all' || String(emp.department?.id) === selectedDept
      const matchStatus =
        selectedStatus === 'all' || emp.employment_status === selectedStatus

      return matchSearch && matchDept && matchStatus
    })
  }, [employees, search, selectedDept, selectedStatus])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        department_id: Number(formData.department_id) || departments[0]?.id || 1,
        job_position_id: Number(formData.job_position_id) || positions[0]?.id || 1,
        basic_salary: Number(formData.basic_salary),
        contract_number: formData.contract_number || `CTR/${Date.now()}`,
      }

      const res = await api.post('/employees', payload)
      toast.success(
        'Karyawan Berhasil Didaftarkan',
        `Profil ${res.data?.data?.user?.name || formData.name} telah disimpan ke database.`
      )
      setShowAddModal(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menambahkan karyawan.'
      toast.error('Gagal Registrasi', msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatRupiah = (val?: number) => {
    if (typeof val !== 'number') return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-primary font-normal text-xs uppercase tracking-wider mb-1">
            <Icon icon={Building01Icon} size={15} />
            <span>Master Data HR & Workforce</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Direktori & Manajemen Karyawan
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-normal">
            Kelola profil tenaga kerja, divisi, kontrak PKWT/PKWTT, dan basis payroll.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (departments.length > 0 && !formData.department_id) {
              setFormData((prev) => ({
                ...prev,
                department_id: String(departments[0].id),
                job_position_id: String(positions[0]?.id || 1),
              }))
            }
            setShowAddModal(true)
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-xs transition-colors text-xs shrink-0"
        >
          <Icon icon={UserAdd01Icon} size={15} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Icon icon={Search01Icon} size={15} />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-muted border border-border text-foreground text-xs font-normal rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-muted border border-border text-foreground text-xs font-normal rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Status</option>
            <option value="permanent">Tetap (PKWTT)</option>
            <option value="contract">Kontrak (PKWT)</option>
            <option value="probation">Probation</option>
            <option value="intern">Magang / Intern</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-8 bg-muted/60 rounded-lg w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 rounded bg-muted" />
                    <div className="w-24 h-2.5 rounded bg-muted/60" />
                  </div>
                </div>
                <div className="w-32 h-3.5 rounded bg-muted hidden sm:block" />
                <div className="w-20 h-5 rounded-md bg-muted" />
                <div className="w-24 h-3.5 rounded bg-muted hidden md:block" />
                <div className="w-16 h-7 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-1.5 font-normal">
            <Icon icon={UserGroupIcon} size={22} className="text-muted-foreground" />
            <span className="text-sm font-normal text-foreground">
              Tidak Ada Karyawan Ditemukan
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Sesuaikan kata kunci pencarian atau filter status untuk menemukan profil yang dicari.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Karyawan</th>
                  <th className="py-2.5 px-4">Departemen & Jabatan</th>
                  <th className="py-2.5 px-4">Status Kepegawaian</th>
                  <th className="py-2.5 px-4">Gaji Pokok Basis</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((emp) => {
                  const statusBadge =
                    emp.employment_status === 'permanent'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                      : emp.employment_status === 'contract'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : emp.employment_status === 'probation'
                      ? 'bg-secondary text-secondary-foreground border-secondary/40'
                      : 'bg-muted text-muted-foreground border-border'

                  const statusLabel =
                    emp.employment_status === 'permanent'
                      ? 'Tetap (PKWTT)'
                      : emp.employment_status === 'contract'
                      ? 'Kontrak (PKWT)'
                      : emp.employment_status === 'probation'
                      ? 'Probation'
                      : 'Magang'

                  return (
                    <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-medium text-primary text-xs shrink-0">
                            {emp.user?.name ? emp.user.name.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <div className="font-normal text-foreground text-xs">
                              {emp.user?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center space-x-1.5 font-normal">
                              <span>NIK: {emp.nik}</span>
                              <span>•</span>
                              <span>{emp.user?.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-normal text-foreground text-xs">
                          {emp.job_position?.title || 'Staff'}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {emp.department?.name || 'Departemen'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border ${statusBadge}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground text-xs">
                        {formatRupiah(emp.active_contract?.basic_salary)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors border border-border"
                        >
                          <Icon icon={EyeIcon} size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center">
                  {selectedEmployee.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {selectedEmployee.user?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-normal">
                    NIK: {selectedEmployee.nik} | No KTP: {selectedEmployee.ktp_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Icon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                  Informasi Pekerjaan
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Departemen: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.department?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Jabatan: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.job_position?.title || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Manajer Langsung: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.manager?.name || 'Direksi'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Status: </span>
                  <span className="font-medium text-primary capitalize">
                    {selectedEmployee.employment_status}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                  Payroll & Perbankan
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Gaji Pokok: </span>
                  <span className="font-semibold text-primary">
                    {formatRupiah(selectedEmployee.active_contract?.basic_salary)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Nomor Kontrak: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.active_contract?.contract_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">Bank Penerima: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.bank_name || 'BCA'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-normal">No Rekening: </span>
                  <span className="font-normal text-foreground">
                    {selectedEmployee.bank_account_number || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs border border-border"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-medium text-foreground">
                  Pendaftaran Karyawan Baru
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Lengkapi data identitas, penempatan organisasi, dan kontrak gaji karyawan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Icon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-normal text-muted-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                    placeholder="misal: Rian Pratama"
                  />
                </div>

                <div>
                  <label className="block font-normal text-muted-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Email Perusahaan *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                    placeholder="rian@hris.local"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Nomor Induk Karyawan (NIK) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                    placeholder="EMP-2026-009"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Nomor KTP (16 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.ktp_number}
                    onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                    placeholder="3174012345670001"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Departemen *
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Jabatan / Posisi *
                  </label>
                  <select
                    value={formData.job_position_id}
                    onChange={(e) => setFormData({ ...formData, job_position_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Status Kepegawaian *
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  >
                    <option value="permanent">Tetap (PKWTT)</option>
                    <option value="contract">Kontrak (PKWT)</option>
                    <option value="probation">Probation</option>
                    <option value="intern">Magang / Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Gaji Pokok (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-normal text-xs transition-colors border border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Icon icon={CheckmarkCircle01Icon} size={15} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Icon icon={Building01Icon} size={16} />
            <span>Master Data HR & Workforce</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Direktori & Manajemen Karyawan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola profil lengkap tenaga kerja, penempatan divisi, kontrak PKWT/PKWTT, dan basis payroll.
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
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all text-sm shrink-0"
        >
          <Icon icon={UserAdd01Icon} size={18} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon icon={Search01Icon} size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, atau email karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
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
            className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="permanent">Tetap (PKWTT)</option>
            <option value="contract">Kontrak (PKWT)</option>
            <option value="probation">Probation</option>
            <option value="intern">Magang / Intern</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat direktori karyawan...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
              <Icon icon={UserGroupIcon} size={24} />
            </div>
            <span className="text-sm font-bold text-slate-700">
              Tidak Ada Karyawan Ditemukan
            </span>
            <span className="text-xs text-slate-400 max-w-sm">
              Sesuaikan kata kunci pencarian atau filter status untuk menemukan profil yang dicari.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Karyawan</th>
                  <th className="py-3.5 px-6">Departemen & Jabatan</th>
                  <th className="py-3.5 px-6">Status Kepegawaian</th>
                  <th className="py-3.5 px-6">Gaji Pokok Basis</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const statusBadge =
                    emp.employment_status === 'permanent'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      : emp.employment_status === 'contract'
                      ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                      : emp.employment_status === 'probation'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                      : 'bg-purple-50 text-purple-700 border-purple-200/60'

                  const statusLabel =
                    emp.employment_status === 'permanent'
                      ? 'Tetap (PKWTT)'
                      : emp.employment_status === 'contract'
                      ? 'Kontrak (PKWT)'
                      : emp.employment_status === 'probation'
                      ? 'Probation'
                      : 'Magang'

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-black text-indigo-700 text-xs shrink-0">
                            {emp.user?.name ? emp.user.name.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {emp.user?.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center space-x-2 font-mono mt-0.5">
                              <span>NIK: {emp.nik}</span>
                              <span>•</span>
                              <span>{emp.user?.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 text-xs">
                          {emp.job_position?.title || 'Staff'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.department?.name || 'Departemen'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-slate-800 text-xs">
                        {formatRupiah(emp.active_contract?.basic_salary)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs transition-colors"
                        >
                          <Icon icon={EyeIcon} size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center">
                  {selectedEmployee.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedEmployee.user?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    NIK: {selectedEmployee.nik} | No KTP: {selectedEmployee.ktp_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <Icon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Informasi Pekerjaan
                </div>
                <div>
                  <span className="text-slate-500">Departemen: </span>
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.department?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Jabatan: </span>
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.job_position?.title || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Manajer Langsung: </span>
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.manager?.name || 'Direksi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span className="font-bold text-indigo-700 capitalize">
                    {selectedEmployee.employment_status}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Payroll & Perbankan
                </div>
                <div>
                  <span className="text-slate-500">Gaji Pokok: </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatRupiah(selectedEmployee.active_contract?.basic_salary)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Nomor Kontrak: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedEmployee.active_contract?.contract_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Bank Penerima: </span>
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.bank_name || 'BCA'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">No Rekening: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedEmployee.bank_account_number || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Pendaftaran Karyawan Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data identitas, penempatan organisasi, dan kontrak gaji karyawan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <Icon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="misal: Rian Pratama"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Perusahaan *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="rian@hris.local"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Induk Karyawan (NIK) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="EMP-2026-009"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor KTP (16 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.ktp_number}
                    onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="3174012345670001"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Departemen *
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan / Posisi *
                  </label>
                  <select
                    value={formData.job_position_id}
                    onChange={(e) => setFormData({ ...formData, job_position_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Kepegawaian *
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="permanent">Tetap (PKWTT)</option>
                    <option value="contract">Kontrak (PKWT)</option>
                    <option value="probation">Probation</option>
                    <option value="intern">Magang / Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gaji Pokok (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Icon icon={CheckmarkCircle01Icon} size={16} />
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

import React, { useState, useEffect, useMemo } from 'react'
import {
  UserGroupIcon,
  UserAdd01Icon,
  Search01Icon,
  Building01Icon,
  EyeIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Camera01Icon,
  File01Icon,
  SparklesIcon,
  RefreshIcon,
  CreditCardIcon,
  Edit01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Avatar } from '../common/Avatar'
import { AvatarCropModal } from '../common/AvatarCropModal'
import { Pagination } from '../common/Pagination'
import api, { employeeService } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import type { Employee, Department, JobPosition } from '../../types'
import { Skeleton } from '../ui/skeleton'

export const EmployeeManagement: React.FC = () => {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [search, setSearch] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null)
  const [cropTarget, setCropTarget] = useState<'create' | 'detail'>('create')
  const [isGeneratingNik, setIsGeneratingNik] = useState<boolean>(false)
  const [isEditingBank, setIsEditingBank] = useState<boolean>(false)
  const [bankEditData, setBankEditData] = useState({
    bank_name: 'BCA',
    bank_account_number: '',
    bank_account_holder: '',
  })
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false)

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmployee(emp)
    setIsEditingBank(false)
    setBankEditData({
      bank_name: emp.bank_name || 'BCA',
      bank_account_number: emp.bank_account_number || '',
      bank_account_holder: emp.bank_account_holder || emp.user?.name || '',
    })
  }

  const handleSaveBank = async () => {
    if (!selectedEmployee) return
    setIsSavingBank(true)
    try {
      const res = await employeeService.updateEmployee(selectedEmployee.id, {
        bank_name: bankEditData.bank_name,
        bank_account_number: bankEditData.bank_account_number,
        bank_account_holder: bankEditData.bank_account_holder,
      })
      const updated = res.data?.data
      if (updated) {
        setSelectedEmployee((prev) => (prev ? { ...prev, ...updated } : null))
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
        )
        toast.success('Rekening Disimpan', 'Data perbankan karyawan berhasil diperbarui.')
        setIsEditingBank(false)
      }
    } catch (err) {
      console.error('Error updating bank info:', err)
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat memperbarui data rekening.')
    } finally {
      setIsSavingBank(false)
    }
  }

  const handleGenerateNik = async () => {
    setIsGeneratingNik(true)
    try {
      const res = await employeeService.getNextNik()
      if (res.data?.data?.nik) {
        setFormData((prev) => ({ ...prev, nik: res.data.data.nik }))
        return res.data.data.nik
      }
    } catch (err) {
      console.warn('Fallback to local NIK generation:', err)
      const year = new Date().getFullYear()
      const seq = String(employees.length + 1).padStart(3, '0')
      const fallbackNik = `EMP-${year}-${seq}`
      setFormData((prev) => ({ ...prev, nik: fallbackNik }))
      return fallbackNik
    } finally {
      setIsGeneratingNik(false)
    }
  }

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
      const emps = Array.isArray(empRes.data?.data) ? empRes.data.data : []
      const depts = Array.isArray(deptRes.data?.data) ? deptRes.data.data : []
      const pos = Array.isArray(posRes.data?.data) ? posRes.data.data : []

      setEmployees(emps)
      setDepartments(depts)
      setPositions(pos)

      // Initialize default department & position in form if empty
      if (depts.length > 0) {
        setFormData((prev) => ({
          ...prev,
          department_id: prev.department_id || String(depts[0].id),
        }))
      }
      if (pos.length > 0) {
        setFormData((prev) => ({
          ...prev,
          job_position_id: prev.job_position_id || String(pos[0].id),
        }))
      }
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
    if (!Array.isArray(employees)) return []
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

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedDept, selectedStatus])

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, currentPage, pageSize])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: Record<string, any> = {
        ...formData,
        department_id: Number(formData.department_id) || departments[0]?.id || 1,
        job_position_id: Number(formData.job_position_id) || positions[0]?.id || 1,
        basic_salary: Number(formData.basic_salary),
        contract_number: formData.contract_number || `CTR/${Date.now()}`,
      }

      const formPayload = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formPayload.append(k, String(v))
        }
      })
      if (avatarFile) {
        formPayload.append('avatar', avatarFile)
      }
      if (contractFile) {
        formPayload.append('document', contractFile)
      }

      const res = await employeeService.createEmployee(formPayload)
      toast.success(
        'Karyawan Berhasil Didaftarkan',
        `Profil ${res.data?.data?.user?.name || formData.name} telah disimpan ke database.`
      )
      setShowAddModal(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      setContractFile(null)
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
            if (!formData.nik) {
              handleGenerateNik()
            }
            setShowAddModal(true)
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold rounded-lg shadow-xs transition-colors text-xs shrink-0 cursor-pointer active:scale-[0.98]"
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
            {(Array.isArray(departments) ? departments : []).map((d) => (
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
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 border-b border-border/40">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="w-32 h-3.5" />
                    <Skeleton className="w-24 h-2.5" />
                  </div>
                </div>
                <Skeleton className="w-32 h-3.5 hidden sm:block" />
                <Skeleton className="w-20 h-5 rounded-md" />
                <Skeleton className="w-24 h-3.5 hidden md:block" />
                <Skeleton className="w-16 h-7 rounded-lg" />
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
          <>
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
                  {paginatedEmployees.map((emp) => {
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
                            <Avatar src={emp.user?.avatar_url} name={emp.user?.name} size="sm" />
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
                            onClick={() => handleOpenDetail(emp)}
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

            <Pagination
              currentPage={currentPage}
              totalItems={filteredEmployees.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="relative group w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <Avatar src={selectedEmployee.user?.avatar_url} name={selectedEmployee.user?.name} size="lg" className="w-full h-full" />
                  <label
                    htmlFor="detail-avatar-change"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[9px] font-medium z-10"
                    title="Ubah Foto Profil"
                  >
                    <Icon icon={Camera01Icon} size={14} />
                    <span>Ubah</span>
                  </label>
                  <input
                    type="file"
                    id="detail-avatar-change"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (!file.type.startsWith('image/')) {
                        toast.error('Format Tidak Didukung', 'Harap pilih file gambar.')
                        return
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File Terlalu Besar', 'Maksimal ukuran foto 10 MB.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setCropSourceImage(reader.result as string)
                        setCropTarget('detail')
                        setIsCropModalOpen(true)
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }}
                  />
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

              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Icon icon={CreditCardIcon} size={12} />
                    <span>Payroll & Perbankan</span>
                  </div>
                  {!isEditingBank ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBankEditData({
                          bank_name: selectedEmployee.bank_name || 'BCA',
                          bank_account_number: selectedEmployee.bank_account_number || '',
                          bank_account_holder: selectedEmployee.bank_account_holder || selectedEmployee.user?.name || '',
                        })
                        setIsEditingBank(true)
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Icon icon={Edit01Icon} size={11} />
                      <span>Ubah Bank</span>
                    </button>
                  ) : null}
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

                {!isEditingBank ? (
                  <>
                    <div>
                      <span className="text-muted-foreground font-normal">Bank Penerima: </span>
                      <span className="font-medium text-foreground">
                        {selectedEmployee.bank_name || 'BCA'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-normal">No Rekening: </span>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {selectedEmployee.bank_account_number || '-'}
                      </span>
                    </div>
                    {selectedEmployee.bank_account_holder && (
                      <div>
                        <span className="text-muted-foreground font-normal">Atas Nama: </span>
                        <span className="font-normal text-foreground">
                          {selectedEmployee.bank_account_holder}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pt-2 border-t border-border/80 space-y-2">
                    <div>
                      <label className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">
                        Bank Penerima
                      </label>
                      <select
                        value={bankEditData.bank_name}
                        onChange={(e) => setBankEditData({ ...bankEditData, bank_name: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-normal"
                      >
                        {['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Bank Permata', 'Bank Danamon', 'Bank Mega', 'BTN', 'Bank Jago', 'Seabank', 'Lainnya'].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        value={bankEditData.bank_account_number}
                        onChange={(e) => setBankEditData({ ...bankEditData, bank_account_number: e.target.value })}
                        placeholder="misal: 1234567890"
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs font-mono focus:ring-1 focus:ring-primary font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">
                        Atas Nama Rekening
                      </label>
                      <input
                        type="text"
                        value={bankEditData.bank_account_holder}
                        onChange={(e) => setBankEditData({ ...bankEditData, bank_account_holder: e.target.value })}
                        placeholder={selectedEmployee.user?.name || 'Nama Pemilik Rekening'}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary font-normal"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveBank}
                        disabled={isSavingBank}
                        className="px-2.5 py-1 bg-primary text-primary-foreground text-[11px] font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingBank ? 'Menyimpan...' : 'Simpan Rekening'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className="px-2.5 py-1 bg-muted text-muted-foreground text-[11px] font-medium rounded-md hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {selectedEmployee.active_contract?.document_url && (
                  <div className="pt-1 border-t border-border/60">
                    <a
                      href={selectedEmployee.active_contract.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-primary hover:underline font-medium text-[11px]"
                    >
                      <Icon icon={File01Icon} size={13} />
                      <span>Lihat Dokumen Kontrak</span>
                    </a>
                  </div>
                )}
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
              {/* Avatar Upload Field with Interactive Crop */}
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                <Avatar src={avatarPreview} name={formData.name || 'Karyawan'} size="lg" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Foto Avatar Karyawan (Opsional)
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Format JPG, PNG, atau WebP (maks. 1 MB).
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    id="employee-avatar-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (!file.type.startsWith('image/')) {
                        toast.error('Format Tidak Didukung', 'Harap pilih file gambar.')
                        return
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File Terlalu Besar', 'Maksimal ukuran foto 10 MB.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setCropSourceImage(reader.result as string)
                        setCropTarget('create')
                        setIsCropModalOpen(true)
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="employee-avatar-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background border border-border hover:bg-muted text-xs font-medium text-foreground cursor-pointer transition-colors shadow-2xs"
                    >
                      <Icon icon={Camera01Icon} size={13} />
                      <span>{avatarPreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setCropSourceImage(avatarPreview)
                          setCropTarget('create')
                          setIsCropModalOpen(true)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground border border-border cursor-pointer transition-colors"
                      >
                        Atur Posisi
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-foreground uppercase tracking-wider text-[11px]">
                      Nomor Induk Karyawan (NIK) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNik}
                      disabled={isGeneratingNik}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Icon icon={SparklesIcon} size={12} className={isGeneratingNik ? 'animate-spin' : ''} />
                      <span>{isGeneratingNik ? 'Membuat...' : 'Buat Otomatis'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full px-3 py-2 pr-16 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs font-medium"
                      placeholder="EMP-2026-005"
                    />
                    <div className="absolute inset-y-0 right-1.5 flex items-center">
                      <button
                        type="button"
                        onClick={handleGenerateNik}
                        disabled={isGeneratingNik}
                        title="Regenerasi NIK Otomatis"
                        className="px-2 py-1 text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Icon icon={RefreshIcon} size={10} className={isGeneratingNik ? 'animate-spin' : ''} />
                        <span>Auto</span>
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Format otomatis <span className="font-mono font-medium text-foreground">EMP-YYYY-XXX</span> (tetap dapat diedit manual jika ada format khusus).
                  </p>
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
                    {(Array.isArray(departments) ? departments : []).map((d) => (
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
                    {(Array.isArray(positions) ? positions : []).map((p) => (
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

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Bank Penerima (Payroll)
                  </label>
                  <select
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-normal text-xs"
                  >
                    {['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Bank Permata', 'Bank Danamon', 'Bank Mega', 'BTN', 'Bank Jago', 'Seabank', 'Lainnya'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Nomor Rekening Bank
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    placeholder="misal: 1234567890"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-foreground uppercase tracking-wider text-[11px]">
                      Password Akun Karyawan
                    </label>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Default: <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-semibold">password</code>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    placeholder="password"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Password ini digunakan karyawan untuk pertama kali login (dapat diganti di profil).
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-medium text-foreground mb-1 uppercase tracking-wider text-[11px]">
                    Dokumen Perjanjian Kerja / Kontrak (PDF/Gambar - Opsional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-normal file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {contractFile && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                      <Icon icon={File01Icon} size={13} />
                      <span>{contractFile.name} siap diunggah ke storage cloud.</span>
                    </p>
                  )}
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

      {/* Reusable Avatar Crop & Compression Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropSourceImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={async (croppedFile, previewUrl) => {
          if (cropTarget === 'create') {
            setAvatarFile(croppedFile)
            setAvatarPreview(previewUrl)
            const sizeKb = Math.round(croppedFile.size / 1024)
            toast.success('Foto Disesuaikan', `Foto berhasil dipotong dan dikompres (${sizeKb} KB, maks 1 MB).`)
          } else if (cropTarget === 'detail' && selectedEmployee) {
            try {
              const form = new FormData()
              form.append('avatar', croppedFile)
              const res = await employeeService.updateEmployee(selectedEmployee.id, form)
              if (res.data?.success) {
                const updatedEmp = res.data.data
                setSelectedEmployee(updatedEmp)
                setEmployees((prev) =>
                  prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
                )
                toast.success('Foto Profil Diperbarui', 'Foto avatar karyawan berhasil dikompres dan disimpan.')
              }
            } catch (err: any) {
              toast.error('Gagal Unggah Foto', err.response?.data?.message || 'Gagal mengunggah foto.')
            }
          }
        }}
        maxOutputDimension={512}
        maxFileSizeBytes={1024 * 1024}
      />
    </div>
  )
}

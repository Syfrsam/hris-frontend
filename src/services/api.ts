import axios from 'axios'
import type { Branch } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
})

// Lightweight in-memory GET cache & in-flight deduplication (30s TTL)
const CACHE_TTL_MS = 30_000
const responseCache = new Map<string, { timestamp: number; response: any }>()
const inflightRequests = new Map<string, Promise<any>>()

export const clearApiCache = () => {
  responseCache.clear()
  inflightRequests.clear()
}

// Request Interceptor: Attach Sanctum Bearer Token & invalidate cache on mutations
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hris_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.method && config.method.toLowerCase() !== 'get') {
    responseCache.clear()
  }
  return config
})

// Response Interceptor: Handle Unauthenticated status
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      responseCache.clear()
      localStorage.removeItem('hris_token')
      localStorage.removeItem('hris_user')
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

const rawGet = api.get.bind(api)
api.get = ((url: string, config?: any) => {
  if (config?.responseType === 'blob' || url === '/auth/me') {
    return rawGet(url, config)
  }
  const token = localStorage.getItem('hris_token') || ''
  const key = `${token}:${url}:${JSON.stringify(config?.params || '')}`
  const cached = responseCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve(cached.response)
  }
  const inflight = inflightRequests.get(key)
  if (inflight) {
    return inflight
  }
  const req = rawGet(url, config)
    .then((res) => {
      responseCache.set(key, { timestamp: Date.now(), response: res })
      inflightRequests.delete(key)
      return res
    })
    .catch((err) => {
      inflightRequests.delete(key)
      throw err
    })
  inflightRequests.set(key, req)
  return req
}) as typeof api.get

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const branchService = {
  getBranches: () => api.get('/branches'),
  getBranch: (id: number) => api.get(`/branches/${id}`),
  createBranch: (data: Partial<Branch>) => api.post('/branches', data),
  updateBranch: (id: number, data: Partial<Branch>) => api.put(`/branches/${id}`, data),
  deleteBranch: (id: number) => api.delete(`/branches/${id}`),
}

export const attendanceService = {
  getToday: () => api.get('/attendances/today'),
  clockIn: (data: { latitude: number; longitude: number; photo?: File }) => {
    const formData = new FormData()
    formData.append('latitude', data.latitude.toString())
    formData.append('longitude', data.longitude.toString())
    if (data.photo) formData.append('photo', data.photo)
    return api.post('/attendances/clock-in', formData)
  },
  clockOut: (data: { latitude: number; longitude: number; photo?: File }) => {
    const formData = new FormData()
    formData.append('latitude', data.latitude.toString())
    formData.append('longitude', data.longitude.toString())
    if (data.photo) formData.append('photo', data.photo)
    return api.post('/attendances/clock-out', formData)
  },
  getMyHistory: (month?: string) =>
    api.get(`/attendances/my-history${month ? `?month=${month}` : ''}`),
}

export const leaveService = {
  getTypes: () => api.get('/leaves/types'),
  getBalances: () => api.get('/leaves/balances'),
  getMyLeaves: () => api.get('/leaves'),
  applyLeave: (formData: FormData) =>
    api.post('/leaves', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const overtimeService = {
  getMyOvertimes: () => api.get('/overtimes'),
  applyOvertime: (data: {
    date: string
    start_time: string
    end_time: string
    duration_hours: number
    task_description: string
  }) => api.post('/overtimes', data),
}

export const approvalService = {
  getPendingLeaves: () => api.get('/approvals/leaves'),
  approveLeave: (id: number, notes?: string) =>
    api.post(`/approvals/leaves/${id}/approve`, { notes }),
  rejectLeave: (id: number, notes: string) =>
    api.post(`/approvals/leaves/${id}/reject`, { notes }),
  getPendingOvertimes: () => api.get('/approvals/overtimes'),
  approveOvertime: (id: number, notes?: string) =>
    api.post(`/approvals/overtimes/${id}/approve`, { notes }),
  rejectOvertime: (id: number, notes: string) =>
    api.post(`/approvals/overtimes/${id}/reject`, { notes }),
}

export const payrollService = {
  getMyPayslips: () => api.get('/payrolls/my-payslips'),
  getDetail: (id: number) => api.get(`/payrolls/${id}`),
  downloadPdf: (id: number) =>
    api.get(`/payrolls/${id}/download`, { responseType: 'blob' }),
}

export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (data: {
    name: string
    email: string
    phone?: string
    password: string
    role: string
    is_active?: boolean
  }) => api.post('/users', data),
  updateUser: (
    id: number,
    data: {
      name?: string
      email?: string
      phone?: string | null
      password?: string
      role?: string
      is_active?: boolean
    }
  ) => api.put(`/users/${id}`, data),
}

export default api

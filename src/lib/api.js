const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export function schoolLogoUrl(logoPath) {
  if (!logoPath) return ''
  const normalized = logoPath.replaceAll('\\', '/')
  const relativePath = normalized.includes('uploads/') ? normalized.split('uploads/').pop() : normalized
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/')
  return `${API_BASE}/school/uploads/${encodedPath}`
}

export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data }
}

let refreshPromise = null

export async function api(path, options = {}) {
  const { retry = true, ...fetchOptions } = options
  const token = localStorage.getItem('school_access_token')
  const isForm = fetchOptions.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      ...(!isForm && fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  const refreshToken = localStorage.getItem('school_refresh_token')
  if (response.status === 401 && retry && refreshToken && path !== '/auth/refresh') {
    try {
      if (!refreshPromise) refreshPromise = refreshAccessToken(refreshToken).finally(() => { refreshPromise = null })
      await refreshPromise
      return api(path, { ...fetchOptions, retry: false })
    } catch {
      localStorage.removeItem('school_access_token')
      localStorage.removeItem('school_refresh_token')
      localStorage.removeItem('school_session')
      window.dispatchEvent(new Event('school-session-expired'))
    }
  }
  if (!response.ok) throw new ApiError(data.error || data.message || 'Request failed. Please try again.', response.status, data)
  return data
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.error || data.message || 'Your session has expired.', response.status, data)
  localStorage.setItem('school_access_token', data.token)
  localStorage.setItem('school_refresh_token', data.refresh_token)
  const session = JSON.parse(localStorage.getItem('school_session') || '{}')
  localStorage.setItem('school_session', JSON.stringify({ ...session, token: data.token, refresh_token: data.refresh_token }))
  return data
}

export const schoolApi = {
  schoolLogin: (values) => api('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
  changePassword: (values) => api('/auth/change-password', { method: 'POST', body: JSON.stringify(values) }),
  forgotPassword: (values) => api('/auth/forgot-password', { method: 'POST', body: JSON.stringify(values) }),
  resetPassword: (values) => api('/auth/reset-password', { method: 'POST', body: JSON.stringify(values) }),
  logout: (refreshToken) => api('/auth/logout', { method: 'POST', retry: false, headers: { Authorization: `Bearer ${refreshToken}` } }),
  profile: () => api('/auth/profile'),
  updateProfile: (values) => api('/auth/profile', { method: 'PUT', body: JSON.stringify(values) }),
  superAdminLogin: (values) => api('/super-admin/login', { method: 'POST', body: JSON.stringify(values) }),
  dashboard: () => api('/dashboard/home'),
  people: () => api('/master/people'),
  academics: () => api('/master/academics'),
  settings: () => api('/master/settings'),
  schools: () => api('/school/list'),
  createSchool: (values) => api('/school/setup', { method: 'POST', body: toFormData(values) }),
  students: () => api('/student/all'),
  teachers: () => api('/teacher/all'),
  parents: () => api('/parent/all'),
  classes: () => api('/class/all'),
  users: (superAdmin = false) => api(superAdmin ? '/super-admin/users' : '/users'),
  createUser: (values) => api('/create-school-admin', { method: 'POST', body: JSON.stringify(values) }),
  createStudent: (values) => api('/student/create', { method: 'POST', body: toFormData(values) }),
  createTeacher: (values) => api('/teacher/create', { method: 'POST', body: toFormData(values) }),
  createParent: (values) => api('/parent/create', { method: 'POST', body: JSON.stringify(values) }),
  createClass: (values) => api('/class/create', { method: 'POST', body: JSON.stringify(values) }),
  attendance: (date, className = 'All', section = 'All') => api(`/attendance/get?attendance_date=${date}&class_name=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`),
  markAttendance: (values) => api('/attendance/mark', { method: 'POST', body: JSON.stringify(values) }),
  sendNotification: (type, values) => api(`/notifications/${type}`, { method: 'POST', body: JSON.stringify(values) }),
  notificationHistory: (limit = 50) => api(`/notifications/all?limit=${limit}`),
  notificationsByUser: (userId) => api(`/notifications/user?user_id=${encodeURIComponent(userId)}`),
  upgradeAllSchools: () => api('/admin/upgrade-all-schools', { method: 'POST' }),
}

function toFormData(values) {
  const form = new FormData()
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) form.append(key, value) })
  return form
}

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

export async function api(path, options = {}) {
  const token = localStorage.getItem('school_access_token')
  const isForm = options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(!isForm && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.error || data.message || 'Request failed. Please try again.', response.status, data)
  return data
}

export const schoolApi = {
  schoolLogin: (values) => api('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
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

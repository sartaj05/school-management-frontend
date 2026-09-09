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
  sessions: () => api('/auth/sessions'),
  revokeSession: (sessionId) => api(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
  superAdminLogin: (values) => api('/super-admin/login', { method: 'POST', body: JSON.stringify(values) }),
  dashboard: () => api('/dashboard/home'),
  people: () => api('/master/people'),
  academics: () => api('/master/academics'),
  settings: () => api('/master/settings'),
  schools: () => api('/school/list'),
  school: (schoolId) => api(`/school/${schoolId}`),
  updateSchool: (schoolId, values) => api(`/school/${schoolId}`, { method: 'PUT', body: JSON.stringify(values) }),
  updateSchoolStatus: (schoolId, status) => api(`/school/${schoolId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createSchool: (values) => api('/school/setup', { method: 'POST', body: toFormData(values) }),
  students: () => api('/student/all'),
  student: (studentId) => api(`/student/${studentId}`),
  updateStudent: (studentId, values) => api(`/student/${studentId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteStudent: (studentId) => api(`/student/${studentId}`, { method: 'DELETE' }),
  teachers: () => api('/teacher/all'),
  teacher: (teacherId) => api(`/teacher/${teacherId}`),
  updateTeacher: (teacherId, values) => api(`/teacher/${teacherId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteTeacher: (teacherId) => api(`/teacher/${teacherId}`, { method: 'DELETE' }),
  parents: () => api('/parent/all'),
  parent: (parentId) => api(`/parent/${parentId}`),
  updateParent: (parentId, values) => api(`/parent/${parentId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteParent: (parentId) => api(`/parent/${parentId}`, { method: 'DELETE' }),
  parentStudents: (parentId) => api(`/parent/${parentId}/students`),
  studentParents: (studentId) => api(`/parent/students/${studentId}/parents`),
  linkParentStudent: (parentId, values) => api(`/parent/${parentId}/students`, { method: 'POST', body: JSON.stringify(values) }),
  unlinkParentStudent: (parentId, studentId) => api(`/parent/${parentId}/students/${studentId}`, { method: 'DELETE' }),
  classes: () => api('/class/all'),
  schoolClass: (classId) => api(`/class/${classId}`),
  updateClass: (classId, values) => api(`/class/${classId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteClass: (classId) => api(`/class/${classId}`, { method: 'DELETE' }),
  subjects: () => api('/subjects'),
  subject: (subjectId) => api(`/subjects/${subjectId}`),
  createSubject: (values) => api('/subjects', { method: 'POST', body: JSON.stringify(values) }),
  updateSubject: (subjectId, values) => api(`/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteSubject: (subjectId) => api(`/subjects/${subjectId}`, { method: 'DELETE' }),
  timetable: (filters = '') => api(`/timetable${filters ? `?${filters}` : ''}`),
  timetablePeriod: (periodId) => api(`/timetable/${periodId}`),
  createTimetablePeriod: (values) => api('/timetable', { method: 'POST', body: JSON.stringify(values) }),
  updateTimetablePeriod: (periodId, values) => api(`/timetable/${periodId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteTimetablePeriod: (periodId) => api(`/timetable/${periodId}`, { method: 'DELETE' }),
  teacherClassAssignments: (filters = '') => api(`/teacher-class-assignment/list${filters ? `?${filters}` : ''}`),
  teacherClassAssignment: (assignmentId) => api(`/teacher-class-assignment/${assignmentId}`),
  createTeacherClassAssignment: (values) => api('/teacher-class-assignment/create', { method: 'POST', body: JSON.stringify(values) }),
  updateTeacherClassAssignment: (assignmentId, values) => api(`/teacher-class-assignment/${assignmentId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteTeacherClassAssignment: (assignmentId) => api(`/teacher-class-assignment/${assignmentId}`, { method: 'DELETE' }),
  users: (superAdmin = false) => api(superAdmin ? '/super-admin/users' : '/users'),
  createUser: (values) => api('/create-school-admin', { method: 'POST', body: JSON.stringify(values) }),
  createStudent: (values) => api('/student/create', { method: 'POST', body: toFormData(values) }),
  createTeacher: (values) => api('/teacher/create', { method: 'POST', body: toFormData(values) }),
  createParent: (values) => api('/parent/create', { method: 'POST', body: JSON.stringify(values) }),
  createClass: (values) => api('/class/create', { method: 'POST', body: JSON.stringify(values) }),
  attendance: (date, className = 'All', section = 'All') => api(`/attendance/get?attendance_date=${date}&class_name=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`),
  attendanceReport: (filters = '') => api(`/attendance/report${filters ? `?${filters}` : ''}`),
  markAttendance: (values) => api('/attendance/mark', { method: 'POST', body: JSON.stringify(values) }),
  sendNotification: (type, values) => api(`/notifications/${type}`, { method: 'POST', body: JSON.stringify(values) }),
  notificationHistory: (limit = 50) => api(`/notifications/all?limit=${limit}`),
  notificationsByUser: (userId) => api(`/notifications/user?user_id=${encodeURIComponent(userId)}`),
  notificationQueue: (status = 'all', page = 1) => api(`/notifications/queue?status=${encodeURIComponent(status)}&page=${page}&per_page=25`),
  queueNotification: (values) => api('/notifications/queue', { method: 'POST', body: JSON.stringify(values) }),
  retryNotification: (notificationId) => api(`/notifications/queue/${notificationId}/retry`, { method: 'POST' }),
  cancelNotification: (notificationId) => api(`/notifications/queue/${notificationId}/cancel`, { method: 'POST' }),
  processNotificationQueue: (limit = 25) => api('/notifications/queue/process', { method: 'POST', body: JSON.stringify({ limit }) }),
  exams: (status = 'all') => api(`/exams?status=${encodeURIComponent(status)}`),
  createExam: (values) => api('/exams', { method: 'POST', body: JSON.stringify(values) }),
  updateExam: (examId, values) => api(`/exams/${examId}`, { method: 'PUT', body: JSON.stringify(values) }),
  publishExam: (examId) => api(`/exams/${examId}/publish`, { method: 'POST' }),
  examStudents: (examId, subjectId) => api(`/exams/${examId}/students?subject_id=${encodeURIComponent(subjectId)}`),
  saveExamMarks: (examId, values) => api(`/exams/${examId}/marks`, { method: 'PUT', body: JSON.stringify(values) }),
  examReportCards: (examId, studentId = '') => api(`/exams/${examId}/report-cards${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  feeStructures: () => api('/fees/structures'),
  createFeeStructure: (values) => api('/fees/structures', { method: 'POST', body: JSON.stringify(values) }),
  generateFeeInvoices: (structureId) => api(`/fees/structures/${structureId}/generate`, { method: 'POST' }),
  feeInvoices: (status = 'all') => api(`/fees/invoices?status=${encodeURIComponent(status)}`),
  recordFeePayment: (invoiceId, values) => api(`/fees/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(values) }),
  feePayments: (invoiceId) => api(`/fees/invoices/${invoiceId}/payments`),
  queueFeeReminder: (invoiceId, values) => api(`/fees/invoices/${invoiceId}/reminder`, { method: 'POST', body: JSON.stringify(values) }),
  feeSummary: () => api('/fees/summary'),
  upgradeAllSchools: () => api('/admin/upgrade-all-schools', { method: 'POST' }),
}

function toFormData(values) {
  const form = new FormData()
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) form.append(key, value) })
  return form
}

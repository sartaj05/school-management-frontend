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

export async function downloadApi(path, filename) {
  const token = localStorage.getItem('school_access_token')
  const response = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new ApiError(data.message || 'Download failed.', response.status, data) }
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href=url; link.download=filename; link.target='_blank'; link.click(); URL.revokeObjectURL(url)
}

export async function blobApi(path) {
  const token = localStorage.getItem('school_access_token')
  const response = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new ApiError(data.message || 'Media request failed.', response.status, data) }
  return response.blob()
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
  publicContent: () => api('/public/content'),
  updatePublicContent: (values) => api('/public/content', { method: 'PUT', body: values instanceof FormData ? values : toFormData(values) }),
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
  featureAccess: () => api('/school/feature-access'),
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
  updateUser: (userId, values) => api(`/super-admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(values) }),
  updateUserStatus: (userId, values) => api(`/super-admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify(values) }),
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
  notificationAnalytics: (days = 30) => api(`/notifications/analytics?days=${encodeURIComponent(days)}`),
  queueNotification: (values) => api('/notifications/queue', { method: 'POST', body: JSON.stringify(values) }),
  retryNotification: (notificationId) => api(`/notifications/queue/${notificationId}/retry`, { method: 'POST' }),
  cancelNotification: (notificationId) => api(`/notifications/queue/${notificationId}/cancel`, { method: 'POST' }),
  processNotificationQueue: (limit = 25) => api('/notifications/queue/process', { method: 'POST', body: JSON.stringify({ limit }) }),
  runAutomatedAlerts: () => api('/notifications/automation/run', { method: 'POST' }),
  exams: (status = 'all') => api(`/exams?status=${encodeURIComponent(status)}`),
  academicAnalytics: (filters = {}) => api(`/analytics/academic?${new URLSearchParams(filters)}`),
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
  refundFeePayment: (paymentId, values = {}) => api(`/fees/payments/${paymentId}/refund`, { method: 'POST', body: JSON.stringify(values) }),
  feePayments: (invoiceId) => api(`/fees/invoices/${invoiceId}/payments`),
  queueFeeReminder: (invoiceId, values) => api(`/fees/invoices/${invoiceId}/reminder`, { method: 'POST', body: JSON.stringify(values) }),
  feeSummary: () => api('/fees/summary'),
  assignments: (status = 'all') => api(`/assignments?status=${encodeURIComponent(status)}`),
  createAssignment: (values) => api('/assignments', { method: 'POST', body: JSON.stringify(values) }),
  updateAssignment: (assignmentId, values) => api(`/assignments/${assignmentId}`, { method: 'PUT', body: JSON.stringify(values) }),
  changeAssignmentStatus: (assignmentId, status) => api(`/assignments/${assignmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignmentStudents: (assignmentId) => api(`/assignments/${assignmentId}/students`),
  saveAssignmentSubmission: (assignmentId, values) => api(`/assignments/${assignmentId}/submissions`, { method: 'POST', body: JSON.stringify(values) }),
  gradeAssignmentSubmission: (assignmentId, studentId, values) => api(`/assignments/${assignmentId}/submissions/${studentId}/grade`, { method: 'PUT', body: JSON.stringify(values) }),
  libraryBooks: (search = '') => api(`/library/books${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createLibraryBook: (values) => api('/library/books', { method: 'POST', body: JSON.stringify(values) }),
  updateLibraryBook: (bookId, values) => api(`/library/books/${bookId}`, { method: 'PUT', body: JSON.stringify(values) }),
  issueLibraryBook: (bookId, values) => api(`/library/books/${bookId}/issue`, { method: 'POST', body: JSON.stringify(values) }),
  libraryLoans: (status = 'all') => api(`/library/loans?status=${encodeURIComponent(status)}`),
  returnLibraryBook: (loanId, values) => api(`/library/loans/${loanId}/return`, { method: 'POST', body: JSON.stringify(values) }),
  librarySummary: () => api('/library/summary'),
  portalLinkOptions: (profileType) => api(`/portal/link-options?profile_type=${encodeURIComponent(profileType)}`),
  portalLinks: () => api('/portal/profile-links'),
  createPortalLink: (values) => api('/portal/profile-links', { method: 'POST', body: JSON.stringify(values) }),
  revokePortalLink: (linkId) => api(`/portal/profile-links/${linkId}`, { method: 'DELETE' }),
  portalMe: () => api('/portal/me'),
  portalOverview: (studentId) => api(`/portal/overview${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalAttendance: (studentId) => api(`/portal/attendance${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalTimetable: (studentId) => api(`/portal/timetable${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalAssignments: (studentId) => api(`/portal/assignments${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalSubmitAssignment: (assignmentId, values) => api(`/portal/assignments/${assignmentId}/submission`, { method: 'POST', body: JSON.stringify(values) }),
  portalResults: (studentId) => api(`/portal/results${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalFees: (studentId) => api(`/portal/fees${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalPayFee: (invoiceId, values = {}) => api(`/portal/fees/${invoiceId}/pay`, { method: 'POST', body: JSON.stringify(values) }),
  createPortalFeeOrder: (invoiceId) => api(`/portal/fees/${invoiceId}/gateway/order`, { method: 'POST' }),
  verifyPortalFeePayment: (invoiceId, values) => api(`/portal/fees/${invoiceId}/gateway/verify`, { method: 'POST', body: JSON.stringify(values) }),
  downloadFeeReceipt: (paymentId) => downloadApi(`/portal/fees/payments/${paymentId}/receipt`, `fee-receipt-${paymentId}.html`),
  portalLibraryLoans: (studentId) => api(`/portal/library-loans${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalDocuments: (studentId) => api(`/portal/documents${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  portalNotifications: (limit = 50) => api(`/portal/notifications?limit=${encodeURIComponent(limit)}`),
  markPortalNotificationRead: (notificationId) => api(`/portal/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllPortalNotificationsRead: () => api('/portal/notifications/read-all', { method: 'POST' }),
  messageRecipients: (studentId = '') => api(`/messages/recipients${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`),
  messageThreads: () => api('/messages/threads'),
  messageThread: (threadId) => api(`/messages/threads/${threadId}`),
  createMessageThread: (values) => api('/messages/threads', { method: 'POST', body: JSON.stringify(values) }),
  sendMessage: (threadId, values) => api(`/messages/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(values) }),
  markMessageThreadRead: (threadId) => api(`/messages/threads/${threadId}/read`, { method: 'PATCH' }),
  downloadPortalReportCard: (examId, studentId) => downloadApi(`/documents/report-cards/${examId}/students/${studentId}`, `report-card-${examId}-${studentId}.html`),
  calendarEvents: (filters = '') => api(`/calendar/events${filters ? `?${filters}` : ''}`),
  calendarEvent: (eventId) => api(`/calendar/events/${eventId}`),
  createCalendarEvent: (values) => api('/calendar/events', { method: 'POST', body: JSON.stringify(values) }),
  updateCalendarEvent: (eventId, values) => api(`/calendar/events/${eventId}`, { method: 'PUT', body: JSON.stringify(values) }),
  cancelCalendarEvent: (eventId) => api(`/calendar/events/${eventId}/cancel`, { method: 'POST' }),
  submitAdmission: (values) => api('/admissions/apply', { method: 'POST', body: JSON.stringify(values) }),
  admissionApplications: (status = 'all') => api(`/admissions/applications?status=${encodeURIComponent(status)}`),
  updateAdmissionApplication: (applicationId, values) => api(`/admissions/applications/${applicationId}`, { method: 'PUT', body: JSON.stringify(values) }),
  documents: () => api('/documents/history'),
  downloadAttendanceCsv: (attendanceDate) => downloadApi(`/documents/attendance.csv?attendance_date=${encodeURIComponent(attendanceDate)}`, `attendance-${attendanceDate}.csv`),
  openReportCard: (examId, studentId) => downloadApi(`/documents/report-cards/${examId}/students/${studentId}`, `report-card-${examId}-${studentId}.html`),
  staffAttendance: (attendanceDate) => api(`/payroll/attendance?attendance_date=${encodeURIComponent(attendanceDate)}`),
  markStaffAttendance: (values) => api('/payroll/attendance', { method:'POST', body:JSON.stringify(values) }),
  salaryStructures: () => api('/payroll/salary-structures'),
  payslipDocument: (id) => api(`/payroll/payslips/${id}/document`),
  saveSalaryStructure: (values) => api('/payroll/salary-structures', { method:'POST', body:JSON.stringify(values) }),
  runPayroll: (values) => api('/payroll/runs', { method:'POST', body:JSON.stringify(values) }),
  payslips: (month) => api(`/payroll/payslips?payroll_month=${encodeURIComponent(month)}`),
  transportSummary: () => api('/transport/summary'),
  transportVehicles: () => api('/transport/vehicles'),
  createTransportVehicle: (values) => api('/transport/vehicles', { method: 'POST', body: JSON.stringify(values) }),
  updateTransportVehicle: (vehicleId, values) => api(`/transport/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(values) }),
  transportRoutes: () => api('/transport/routes'),
  createTransportRoute: (values) => api('/transport/routes', { method: 'POST', body: JSON.stringify(values) }),
  updateTransportRoute: (routeId, values) => api(`/transport/routes/${routeId}`, { method: 'PUT', body: JSON.stringify(values) }),
  createTransportStop: (routeId, values) => api(`/transport/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(values) }),
  updateTransportStop: (stopId, values) => api(`/transport/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(values) }),
  deleteTransportStop: (stopId) => api(`/transport/stops/${stopId}`, { method: 'DELETE' }),
  transportAssignments: () => api('/transport/assignments'),
  createTransportAssignment: (values) => api('/transport/assignments', { method: 'POST', body: JSON.stringify(values) }),
  deleteTransportAssignment: (assignmentId) => api(`/transport/assignments/${assignmentId}`, { method: 'DELETE' }),
  transportLocations: () => api('/transport/locations'),
  updateTransportLocation: (vehicleId, values) => api(`/transport/vehicles/${vehicleId}/location`, { method: 'POST', body: JSON.stringify(values) }),
  inventoryOptions: () => api('/inventory/options'),
  inventorySummary: () => api('/inventory/summary'),
  inventoryItems: (filters = {}) => api(`/inventory/items?${new URLSearchParams(filters)}`),
  inventoryItem: (id) => api(`/inventory/items/${id}`),
  createInventoryCategory: (values) => api('/inventory/categories', { method: 'POST', body: JSON.stringify(values) }),
  createInventoryRoom: (values) => api('/inventory/rooms', { method: 'POST', body: JSON.stringify(values) }),
  createInventoryItem: (values) => api('/inventory/items', { method: 'POST', body: JSON.stringify(values) }),
  updateInventoryItem: (id, values) => api(`/inventory/items/${id}`, { method: 'PUT', body: JSON.stringify(values) }),
  inventoryStock: (id, values) => api(`/inventory/items/${id}/stock`, { method: 'POST', body: JSON.stringify(values) }),
  assignInventoryItem: (id, values) => api(`/inventory/items/${id}/assignments`, { method: 'POST', body: JSON.stringify(values) }),
  returnInventoryAssignment: (id, values) => api(`/inventory/assignments/${id}/return`, { method: 'POST', body: JSON.stringify(values) }),
  startInventoryMaintenance: (id, values) => api(`/inventory/items/${id}/maintenance`, { method: 'POST', body: JSON.stringify(values) }),
  completeInventoryMaintenance: (id, values) => api(`/inventory/maintenance/${id}/complete`, { method: 'POST', body: JSON.stringify(values) }),
  inventoryRecords: (kind, filters = {}) => api(`/inventory/${kind}?${new URLSearchParams(filters)}`),
  inventoryPurchaseSummary: () => api('/inventory/purchase-summary'),
  inventorySuppliers: () => api('/inventory/purchase-suppliers'),
  createInventorySupplier: (values) => api('/inventory/purchase-suppliers', { method: 'POST', body: JSON.stringify(values) }),
  inventoryPurchaseOrders: (filters = {}) => api(`/inventory/purchase-orders?${new URLSearchParams(filters)}`),
  createInventoryPurchaseOrder: (values) => api('/inventory/purchase-orders', { method: 'POST', body: JSON.stringify(values) }),
  updateInventoryPurchaseOrderStatus: (id, values) => api(`/inventory/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(values) }),
  receiveInventoryPurchaseOrder: (id, values) => api(`/inventory/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(values) }),
  meetingOptions: () => api('/meetings/options'),
  meetingSlots: (filters = {}) => api(`/meetings/slots?${new URLSearchParams(filters)}`),
  createMeetingSlot: (values) => api('/meetings/slots', { method: 'POST', body: JSON.stringify(values) }),
  cancelMeetingSlot: (id, values = {}) => api(`/meetings/slots/${id}/cancel`, { method: 'POST', body: JSON.stringify(values) }),
  meetingBookings: (filters = {}) => api(`/meetings/bookings?${new URLSearchParams(filters)}`),
  createMeetingBooking: (values) => api('/meetings/bookings', { method: 'POST', body: JSON.stringify(values) }),
  updateMeetingBookingStatus: (id, values) => api(`/meetings/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify(values) }),
  auditSummary: () => api('/audit/summary'),
  auditEvents: (filters = {}) => api(`/audit/events?${new URLSearchParams(filters)}`),
  hostelOptions: () => api('/hostel/options'),
  hostelSummary: () => api('/hostel/summary'),
  hostelBuildings: () => api('/hostel/buildings'),
  createHostelBuilding: (values) => api('/hostel/buildings', { method: 'POST', body: JSON.stringify(values) }),
  hostelRooms: () => api('/hostel/rooms'),
  createHostelRoom: (values) => api('/hostel/rooms', { method: 'POST', body: JSON.stringify(values) }),
  createHostelBed: (roomId, values) => api(`/hostel/rooms/${roomId}/beds`, { method: 'POST', body: JSON.stringify(values) }),
  hostelAllocations: () => api('/hostel/allocations'),
  createHostelAllocation: (values) => api('/hostel/allocations', { method: 'POST', body: JSON.stringify(values) }),
  releaseHostelAllocation: (id, values = {}) => api(`/hostel/allocations/${id}/release`, { method: 'POST', body: JSON.stringify(values) }),
  hostelAttendance: (filters = {}) => api(`/hostel/attendance?${new URLSearchParams(filters)}`),
  markHostelAttendance: (values) => api('/hostel/attendance', { method: 'POST', body: JSON.stringify(values) }),
  hostelVisitors: () => api('/hostel/visitors'),
  createHostelVisitor: (values) => api('/hostel/visitors', { method: 'POST', body: JSON.stringify(values) }),
  checkoutHostelVisitor: (id) => api(`/hostel/visitors/${id}/checkout`, { method: 'POST' }),
  scholarshipOptions: () => api('/scholarships/options'),
  scholarshipSummary: () => api('/scholarships/summary'),
  scholarshipPrograms: () => api('/scholarships/programs'),
  createScholarshipProgram: (values) => api('/scholarships/programs', { method: 'POST', body: JSON.stringify(values) }),
  scholarshipApplications: (status = 'all') => api(`/scholarships/applications?status=${encodeURIComponent(status)}`),
  createScholarshipApplication: (values) => api('/scholarships/applications', { method: 'POST', body: JSON.stringify(values) }),
  reviewScholarshipApplication: (id, values) => api(`/scholarships/applications/${id}/review`, { method: 'PATCH', body: JSON.stringify(values) }),
  scholarshipAwards: () => api('/scholarships/awards'),
  createScholarshipAward: (values) => api('/scholarships/awards', { method: 'POST', body: JSON.stringify(values) }),
  revokeScholarshipAward: (id) => api(`/scholarships/awards/${id}/revoke`, { method: 'POST' }),
  expenseOptions: () => api('/expenses/options'),
  expenseSummary: () => api('/expenses/summary'),
  expenseVendors: () => api('/expenses/vendors'),
  createExpenseVendor: (values) => api('/expenses/vendors', { method: 'POST', body: JSON.stringify(values) }),
  expenseCategories: () => api('/expenses/categories'),
  createExpenseCategory: (values) => api('/expenses/categories', { method: 'POST', body: JSON.stringify(values) }),
  expenseBills: (status = 'all') => api(`/expenses/bills?status=${encodeURIComponent(status)}`),
  createExpenseBill: (values) => api('/expenses/bills', { method: 'POST', body: JSON.stringify(values) }),
  updateExpenseBillStatus: (id, values) => api(`/expenses/bills/${id}/status`, { method: 'PATCH', body: JSON.stringify(values) }),
  expensePayments: () => api('/expenses/payments'),
  createExpensePayment: (values) => api('/expenses/payments', { method: 'POST', body: JSON.stringify(values) }),
  financeSummary: (filters = {}) => api(`/finance/summary?${new URLSearchParams(filters)}`),
  financeEntries: (filters = {}) => api(`/finance/entries?${new URLSearchParams(filters)}`),
  createFinanceEntry: (values) => api('/finance/entries', { method: 'POST', body: JSON.stringify(values) }),
  reconcileFinanceEntry: (id, values) => api(`/finance/entries/${id}/reconcile`, { method: 'PATCH', body: JSON.stringify(values) }),
  leaveOptions: () => api('/leave/options'),
  leaveRequests: (filters = {}) => api(`/leave/requests?${new URLSearchParams(filters)}`),
  createLeaveRequest: (values) => api('/leave/requests', { method: 'POST', body: JSON.stringify(values) }),
  leaveBalances: (filters) => api(`/leave/balances?${new URLSearchParams(filters)}`),
  setLeaveAllowance: (values) => api('/leave/allowances', { method: 'PUT', body: JSON.stringify(values) }),
  updateLeaveStatus: (id, values) => api(`/leave/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(values) }),
  leaveHistory: (id) => api(`/leave/requests/${id}/history`),
  leaveAllowanceHistory: (filters) => api(`/leave/allowances/history?${new URLSearchParams(filters)}`),
  leavePolicy: (year) => api(`/leave/policy?year=${encodeURIComponent(year)}`),
  saveLeavePolicy: (values) => api('/leave/policy', { method: 'PUT', body: JSON.stringify(values) }),
  leaveHolidays: (year) => api(`/leave/holidays?year=${encodeURIComponent(year)}`),
  createLeaveHoliday: (values) => api('/leave/holidays', { method: 'POST', body: JSON.stringify(values) }),
  deleteLeaveHoliday: (id) => api(`/leave/holidays/${id}`, { method: 'DELETE' }),
  smartClassroomOptions: () => api('/smart-classroom/options'),
  smartClassroomSessions: (filters = {}) => api(`/smart-classroom/sessions?${new URLSearchParams(filters)}`),
  createSmartClassroomSession: (values) => api('/smart-classroom/sessions', { method: 'POST', body: JSON.stringify(values) }),
  updateSmartClassroomSession: (id, values) => api(`/smart-classroom/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(values) }),
  uploadSmartClassroomRecording: (id, values) => api(`/smart-classroom/sessions/${id}/recordings`, { method: 'POST', body: values }),
  deleteSmartClassroomRecording: (id) => api(`/smart-classroom/recordings/${id}`, { method: 'DELETE' }),
  hrStaff: (teacherId = '') => api(`/hr/staff${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`),
  hrDocuments: (teacherId = '') => api(`/hr/documents${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`),
  createHrDocument: (values) => api('/hr/documents', { method: 'POST', body: JSON.stringify(values) }),
  hrContracts: (teacherId = '') => api(`/hr/contracts${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`),
  createHrContract: (values) => api('/hr/contracts', { method: 'POST', body: JSON.stringify(values) }),
  hrReviews: (teacherId = '') => api(`/hr/reviews${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`),
  createHrReview: (values) => api('/hr/reviews', { method: 'POST', body: JSON.stringify(values) }),
  hrSalaryHistory: (teacherId = '') => api(`/hr/salary-history${teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : ''}`),
  upgradeAllSchools: () => api('/admin/upgrade-all-schools', { method: 'POST' }),
}

function toFormData(values) {
  const form = new FormData()
  Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) form.append(key, value) })
  return form
}

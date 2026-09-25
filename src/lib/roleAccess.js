// Client fallback for the server-owned permissions returned by
// /school/feature-access. The backend remains the authorization boundary.
const ROLE_PAGE_ACCESS = {
  super_admin: ['overview', 'publicWebsite', 'schools', 'users', 'maintenance'],
  'School Admin': ['overview', 'onboarding', 'reports', 'scheduledReports', 'people', 'academics', 'analytics', 'calendar', 'meetings', 'messages', 'hostel', 'audit', 'admissions', 'inventory', 'staffHr', 'payroll', 'scholarships', 'expenses', 'finance', 'transport', 'leave', 'smartClassroom', 'documents', 'exams', 'fees', 'assignments', 'library', 'teacherAssignments', 'timetable', 'subjects', 'students', 'teachers', 'parents', 'classes', 'attendance', 'attendanceReports', 'portalLinks', 'notifications', 'settings'],
  Teacher: ['overview', 'academics', 'analytics', 'calendar', 'meetings', 'messages', 'reports', 'smartClassroom', 'documents', 'exams', 'assignments', 'library', 'timetable', 'subjects', 'students', 'classes', 'attendance', 'attendanceReports', 'notifications', 'settings', 'leave'],
  Parent: ['overview', 'portal', 'calendar', 'meetings', 'messages', 'documents', 'notifications', 'settings'],
  Student: ['overview', 'portal', 'calendar', 'messages', 'documents', 'notifications', 'leave', 'settings'],
  'Accounts Staff': ['overview', 'reports', 'scheduledReports', 'finance', 'scholarships', 'expenses', 'settings'],
  'Hostel Staff': ['overview', 'hostel', 'settings'],
}

export function localRolePages(role) {
  return ROLE_PAGE_ACCESS[role] || ['overview']
}

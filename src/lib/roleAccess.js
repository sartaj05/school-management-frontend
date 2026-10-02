// Client fallback for the server-owned permissions returned by
// /school/feature-access. The backend remains the authorization boundary.
export const ROLE_PAGE_ACCESS = {
  super_admin: ['overview', 'publicWebsite', 'schools', 'branches', 'users', 'maintenance'],
  'School Admin': ['overview', 'onboarding', 'reports', 'scheduledReports', 'people', 'academics', 'academicYears', 'analytics', 'calendar', 'meetings', 'messages', 'hostel', 'audit', 'admissions', 'inventory', 'staffHr', 'payroll', 'scholarships', 'expenses', 'finance', 'transport', 'leave', 'smartClassroom', 'documents', 'exams', 'fees', 'assignments', 'library', 'teacherAssignments', 'timetable', 'subjects', 'students', 'teachers', 'parents', 'classes', 'attendance', 'attendanceReports', 'portalLinks', 'notifications', 'users', 'settings'],
  Teacher: ['overview', 'academics', 'academicYears', 'analytics', 'calendar', 'meetings', 'messages', 'reports', 'smartClassroom', 'documents', 'exams', 'assignments', 'library', 'timetable', 'subjects', 'students', 'classes', 'attendance', 'attendanceReports', 'notifications', 'settings', 'leave', 'feeCollection'],
  Parent: ['overview', 'portal', 'calendar', 'meetings', 'messages', 'documents', 'notifications', 'settings'],
  Student: ['overview', 'portal', 'calendar', 'messages', 'documents', 'notifications', 'leave', 'settings'],
  'Accounts Staff': ['overview', 'reports', 'scheduledReports', 'fees', 'finance', 'scholarships', 'expenses', 'settings'],
  'Hostel Staff': ['overview', 'hostel', 'settings'],
  Driver: ['overview', 'transport', 'settings'],
}

export function localRolePages(role) {
  return ROLE_PAGE_ACCESS[role] || ['overview']
}

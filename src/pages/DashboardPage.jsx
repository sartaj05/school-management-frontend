/* Dashboard loader effects intentionally synchronize remote API data. */
/* eslint-disable react-hooks/set-state-in-effect */
import { Award, Banknote, BarChart3, BellRing, BookCheck, BookOpen, Building2, Bus, CalendarCheck, CalendarClock, CalendarDays, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, CircleDollarSign, ContactRound, Database, Edit3, Eye, EyeOff, FileText, Globe2, GraduationCap, HeartHandshake, LayoutDashboard, LibraryBig, Link2, LockKeyhole, LogOut, Menu, MessageCircle, Package, Plus, Power, PowerOff, RotateCcw, Save, School, Search, Send, Settings, ShieldCheck, UserRound, UsersRound, Video, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { confirmPopup } from '../lib/confirmPopup'
import Logo from '../components/Logo'
import { FilterResetProvider, useCurrentFilterReset, useFilterReset } from '../components/FilterResetContext'
import { schoolApi, schoolLogoUrl } from '../lib/api'
import { translateNav, translateUi } from '../lib/i18n'
import { localRolePages } from '../lib/roleAccess'
import ProfileUpdateCard from '../components/ProfileUpdateCard'
import ActiveSessionsCard from '../components/ActiveSessionsCard'
import BranchScopeNotice from '../components/BranchScopeNotice'
import StudentDirectory from '../components/StudentDirectory'
import TeacherDirectory from '../components/TeacherDirectory'
import ParentDirectory from '../components/ParentDirectory'
import ClassDirectory from '../components/ClassDirectory'
import SchoolDirectory from '../components/SchoolDirectory'
import SubjectDirectory from '../components/SubjectDirectory'
import TimetableDirectory from '../components/TimetableDirectory'
import TeacherClassAssignmentDirectory from '../components/TeacherClassAssignmentDirectory'
import AttendanceReport from '../components/AttendanceReport'
import NotificationQueue from '../components/NotificationQueue'
import NotificationPreferences from '../components/NotificationPreferences'
import ExamManagement from '../components/ExamManagement'
import FeeManagement from '../components/FeeManagement'
import FeeCollectionRequests from '../components/FeeCollectionRequests'
import AssignmentManagement from '../components/AssignmentManagement'
import LibraryManagement from '../components/LibraryManagement'
import ParentStudentPortal from '../components/ParentStudentPortal'
import PortalLinkManager from '../components/PortalLinkManager'
import SchoolCalendar from '../components/SchoolCalendar'
import AdmissionManagement from '../components/AdmissionManagement'
import DocumentExports from '../components/DocumentExports'
import PayrollManagement from '../components/PayrollManagement'
import TransportManagement from '../components/TransportManagement'
import LeaveManagement from '../components/LeaveManagement'
import InventoryManagement from '../components/InventoryManagement'
import ParentTeacherMeetings from '../components/ParentTeacherMeetings'
import AuditActivityLog from '../components/AuditActivityLog'
import HostelManagement from '../components/HostelManagement'
import ScholarshipManagement from '../components/ScholarshipManagement'
import ExpenseManagement from '../components/ExpenseManagement'
import FinanceLedger from '../components/FinanceLedger'
import MessagingCenter from '../components/MessagingCenter'
import AcademicAnalytics from '../components/AcademicAnalytics'
import StaffHRManagement from '../components/StaffHRManagement'
import SmartClassroomManagement from '../components/SmartClassroomManagement'
import OnboardingCenter from '../components/OnboardingCenter'
import ReportsCenter from '../components/ReportsCenter'
import ScheduledReports from '../components/ScheduledReports'
import OperationsDashboard from '../components/OperationsDashboard'
import BranchManagement from '../components/BranchManagement'
import AcademicYearPromotion from '../components/AcademicYearPromotion'
import { isValidIndiaMobile as phoneOk, normalizeIndiaMobile as phoneValue } from '../lib/indiaMobile'

const baseNav = [[LayoutDashboard,'Overview','overview'],[FileText,'School Onboarding','onboarding','onboarding'],[BarChart3,'Reports & Exports','reports','reports'],[CalendarClock,'Scheduled Reports','scheduledReports','scheduledReports'],[UserRound,'My Portal','portal','portal'],[ContactRound,'People','people','tenant'],[LibraryBig,'Academics','academics','tenant'],[BarChart3,'Academic Analytics','analytics','tenant'],[CalendarClock,'Academic Years','academicYears','admin'],[CalendarDays,'Calendar','calendar','tenant'],[CalendarCheck,'Meetings','meetings','meeting'],[MessageCircle,'Messages','messages','tenant'],[Building2,'Hostel','hostel','hostel'],[ShieldCheck,'Audit Logs','audit','admin'],[GraduationCap,'Admissions','admissions','admin'],[Package,'Inventory & Assets','inventory','admin'],[UsersRound,'Staff HR','staffHr','admin'],[Banknote,'Payroll','payroll','admin'],[CircleDollarSign,'Scholarships','scholarships','accounts'],[Banknote,'Expenses','expenses','accounts'],[CircleDollarSign,'Finance Ledger','finance','accounts'],[Bus,'Transport','transport','staff'],[CalendarCheck,'Leave Management','leave','tenant'],[CircleDollarSign,'Fee Collection','feeCollection','teacher'],[Video,'Smart Classroom','smartClassroom','staff'],[FileText,'Documents','documents','staff'],[Award,'Exams & Results','exams','tenant'],[CircleDollarSign,'Fees','fees','tenant'],[BookCheck,'Assignments','assignments','tenant'],[LibraryBig,'Library','library','tenant'],[Link2,'Teacher Assignments','teacherAssignments','tenant'],[CalendarCheck,'Timetable','timetable','tenant'],[BookOpen,'Subjects','subjects','tenant'],[UsersRound,'Students','students','tenant'],[GraduationCap,'Teachers','teachers','tenant'],[HeartHandshake,'Parents','parents','tenant'],[BookOpen,'Classes','classes','tenant'],[CalendarCheck,'Attendance','attendance','tenant'],[BarChart3,'Attendance Reports','attendanceReports','tenant'],[Link2,'Portal Access','portalLinks','admin'],[BellRing,'Notifications','notifications','tenant'],[Settings,'Settings','settings','tenant'],[Globe2,'Website Content','publicWebsite','super'],[School,'Schools','schools','super'],[Building2,'Branches','branches','super'],[BarChart3,'Users','users'],[Database,'Maintenance','maintenance','super']]
const workflowNavGroups = [
  ['1 · Start here', ['overview', 'portal']],
  ['2 · Set up your school', ['onboarding', 'schools', 'branches', 'academicYears']],
  ['3 · Manage people', ['people', 'students', 'teachers', 'parents', 'users', 'staffHr', 'portalLinks']],
  ['4 · Teaching and learning', ['academics', 'classes', 'subjects', 'teacherAssignments', 'timetable', 'assignments', 'exams', 'library', 'smartClassroom', 'documents']],
  ['5 · Daily operations', ['admissions', 'attendance', 'attendanceReports', 'calendar', 'meetings', 'messages', 'notifications', 'transport', 'hostel', 'inventory', 'leave']],
  ['6 · Fees and finance', ['fees', 'feeCollection', 'scholarships', 'expenses', 'finance', 'payroll']],
  ['7 · Reports and settings', ['analytics', 'reports', 'scheduledReports', 'audit', 'publicWebsite', 'settings', 'maintenance']],
]
const today = new Date().toISOString().slice(0,10)
const COMMON_SECTIONS = ['A','B','C','D','E','F']
const emailOk = value => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value || '')
const domainValue = value => String(value || '').toLowerCase().replace(/[^a-z0-9\s.-]/g, '').replace(/[\s.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
const recommendedDomain = (base, domains) => {
  const clean = domainValue(base || 'school')
  if (!domains.has(clean)) return clean
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${clean}-${index}`
    if (!domains.has(candidate)) return candidate
  }
  return `${clean}-new`
}

export default function DashboardPage(props) {
  return <FilterResetProvider><DashboardPageContent {...props} /></FilterResetProvider>
}

function DashboardPageContent({ session, onLogout, onProfileUpdated, language = 'en' }) {
  const filterReset = useCurrentFilterReset()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultPage = ['Parent', 'Student'].includes(session?.user?.role) ? 'portal' : session?.user?.role === 'Driver' ? 'transport' : 'overview'
  const page = searchParams.get('page') || defaultPage
  const setPage = useCallback((nextPage, options) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      if (nextPage === defaultPage) next.delete('page')
      else next.set('page', nextPage)
      return next
    }, options)
  }, [defaultPage, setSearchParams])
  const [mobile,setMobile]=useState(false), [data,setData]=useState(null), [error,setError]=useState(''), [loading,setLoading]=useState(false), [loadedPage,setLoadedPage]=useState(null)
  const requestVersion=useRef(0)
  const [formOpen,setFormOpen]=useState(false), [notice,setNotice]=useState(''), [resolvedPlan,setResolvedPlan]=useState('')
  const [featureMatrix,setFeatureMatrix]=useState(null), [rolePermissions,setRolePermissions]=useState(null)
  const user=session?.user || {}; const isSuper=user.role==='super_admin'; const isPortalUser=['Parent','Student'].includes(user.role); const isDemoSchool=String(user.school_domain||session?.school_domain||'').startsWith('eduflow_demo_')
  const nav=baseNav.map(([Icon,label,key,scope])=>[Icon,translateNav(language,label),key,scope])
  const t = value => translateUi(language, value)
  const allowedPages = rolePermissions || localRolePages(user.role)
  const canOpen = useCallback(key => allowedPages.includes(key), [allowedPages])
  useEffect(() => { if (!canOpen(page)) setPage('overview') }, [canOpen, page, setPage])
  const schoolPlan=String(user.school_plan||user.plan_setup||session?.school_plan||session?.plan_setup||resolvedPlan||data?.data?.user?.school_plan||'standard').trim().toLowerCase()
  const sessionPlanKnown=isSuper||Boolean(user.school_plan||user.plan_setup||session?.school_plan||session?.plan_setup)
  useEffect(() => {
    if (isSuper) return undefined
    let active = true
    schoolApi.featureAccess().then(result => {
      if (!active) return
      setFeatureMatrix(result.features || {})
      setRolePermissions(result.permissions || null)
      if (result.plan) setResolvedPlan(result.plan)
    }).catch(() => { if (active) setFeatureMatrix({}) })
    return () => { active = false }
  }, [isSuper])
  // The server entitlement response is authoritative. Until it arrives, hide
  // gated modules instead of trusting stale/local plan metadata.
  const serverEnabled = name => isSuper || (featureMatrix ? featureMatrix[name]?.enabled === true : false)
  const featureAccess={analytics:serverEnabled('academic_analytics'),payroll:serverEnabled('leave_and_payroll'),leave:serverEnabled('student_leave_requests'),smartClassroom:serverEnabled('smart_classroom_recording'),hostel:serverEnabled('hostel'),inventory:serverEnabled('inventory_purchase_management'),scholarships:serverEnabled('scholarship_and_concession'),expenses:serverEnabled('expense_and_vendor_payments')}
  const schoolLogo = data?.data?.school?.logo || data?.data?.school?.logo_path || data?.school?.logo || data?.school?.logo_path || session?.school_logo || session?.user?.school_logo || ''
  const profileInitial = (user.name || 'U').slice(0, 1).toUpperCase()
  const [teacherPhoto, setTeacherPhoto] = useState('')
  useEffect(() => {
    if (user.role !== 'Teacher') { setTeacherPhoto(''); return undefined }
    let active = true
    let objectUrl = ''
    schoolApi.teacherProfilePhoto().then(blob => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setTeacherPhoto(objectUrl)
    }).catch(() => { if (active) setTeacherPhoto('') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [user.id, user.role])
  const avatarUrl = user.role === 'Teacher' ? teacherPhoto : (schoolLogo ? schoolLogoUrl(schoolLogo) : '')
  const load=useCallback(async()=>{
    const requestId=++requestVersion.current
    setLoading(true); setError('')
    try {
      let result
      if(page==='people') result=await schoolApi.people()
      else if(page==='academics') result=await schoolApi.academics()
      else if(page==='settings') result=await schoolApi.settings()
      else if(page==='onboarding'||page==='reports'||page==='scheduledReports'||page==='branches'||page==='feeCollection') result={}
      else if(page==='academicYears') result=await schoolApi.academicYears()
      else if(page==='subjects') result=await schoolApi.subjects()
      else if(page==='teacherAssignments') result=await schoolApi.teacherClassAssignments()
      else if(page==='timetable') result=await schoolApi.timetable()
      else if(page==='students') result=await schoolApi.students()
      else if(page==='teachers') result=await schoolApi.teachers()
      else if(page==='parents') result=await schoolApi.parents()
      else if(page==='classes') result=await schoolApi.classes()
      else if(page==='schools') result=await schoolApi.schools()
      else if(page==='users') result=await schoolApi.users(isSuper)
      else if(page==='attendance') result=await schoolApi.attendance(today)
      else if(page==='attendanceReports') result=await schoolApi.attendanceReport()
      else if(page==='notifications'||page==='messages'||page==='analytics'||page==='staffHr'||page==='smartClassroom'||page==='maintenance'||page==='exams'||page==='fees'||page==='assignments'||page==='library'||page==='transport'||page==='inventory'||page==='leave'||page==='meetings'||page==='audit'||page==='hostel'||page==='scholarships'||page==='expenses'||page==='finance'||page==='payroll'||page==='portal'||page==='portalLinks'||page==='calendar'||page==='admissions'||page==='documents') result=sessionPlanKnown?{}:await schoolApi.dashboard()
      else result=await schoolApi.dashboard()
      if(requestId!==requestVersion.current) return
      if(result?.data?.user?.school_plan) setResolvedPlan(result.data.user.school_plan)
      setData(result)
      setLoadedPage(page)
    } catch(e) {
      if(requestId!==requestVersion.current) return
      setError(e.message)
      setLoadedPage(page)
    } finally {
      if(requestId===requestVersion.current) setLoading(false)
    }
  },[page,isSuper,sessionPlanKnown])
  useEffect(()=>{ const timer=setTimeout(load,0); return ()=>clearTimeout(timer) },[load])
  const responseRows=Array.isArray(data?.data)?data.data:[]
  const users=Array.isArray(data?.users)?data.users:[]
  const visibleUsers=isSuper
    ? users.filter(item=>['School Admin','Accounts Staff','Hostel Staff'].includes(item.role))
    : users.filter(item=>!(item.name==='School Principal'&&item.role==='School Admin')
      && !(item.id != null && user.id != null && String(item.id) === String(user.id))
      && !(item.email && user.email && item.email.trim().toLowerCase() === user.email.trim().toLowerCase()))
  const lists={students:Array.isArray(data?.students)?data.students:responseRows,teachers:responseRows,parents:responseRows,classes:responseRows,subjects:responseRows,teacherAssignments:responseRows,timetable:responseRows,schools:Array.isArray(data?.schools)?data.schools:[],users:visibleUsers,attendance:responseRows}
  const pageLoading=loading||loadedPage!==page
  function moveTo(key){if(key!==page){setData(null);setError('');setPage(key)}setMobile(false);setFormOpen(false)}
  function profileUpdated(profile){setData(current=>({...current,data:{...current?.data,profile}}));onProfileUpdated(profile)}
  const canCreate=user.role==='School Admin'
  return <div className="app-shell"><aside className={mobile?'sidebar open':'sidebar'}><div className="sidebar-head"><Logo /><button onClick={()=>setMobile(false)}><X /></button></div><nav aria-label="Main navigation">{workflowNavGroups.map(([section,keys])=>{const items=nav.filter(([, ,key])=>keys.includes(key)&&allowedPages.includes(key)&&featureAccess[key]!==false);if(!items.length)return null;return <div className="sidebar-nav-section" key={section}><span className="sidebar-nav-section-title">{t(section)}</span>{items.map(([Icon,label,key])=><button key={key} className={page===key?'active':''} onClick={()=>moveTo(key)}><Icon />{label}<ChevronRight /></button>)}</div>})}</nav><div className="profile-card"><ProfileAvatar key={avatarUrl} src={avatarUrl} initials={profileInitial} alt={`${user.name || 'User'} profile`} /><div><b>{user.name||t('School user')}</b><small>{user.role ? t(user.role) : t('Member')}</small></div><button onClick={onLogout} title={t('Log out')}><LogOut /></button></div></aside>{mobile&&<button className="sidebar-backdrop" onClick={()=>setMobile(false)} />}
    <main className="dashboard-main"><header className="dashboard-header"><button className="mobile-nav" onClick={()=>setMobile(true)}><Menu /></button><div><small>{user.school_name||t('EduFlow workspace')}</small><h1>{nav.find(n=>n[2]===page)?.[1]}</h1></div><GlobalSearch items={nav.filter(([, ,key])=>allowedPages.includes(key)).filter(([, ,key])=>featureAccess[key]!==false)} onNavigate={moveTo} canSearchRecords={['School Admin','Teacher'].includes(user.role)} />{filterReset.count>0&&<button className="global-clear-filters" type="button" aria-label={`${t('Clear filters')}: ${filterReset.count}`} onClick={filterReset.clearCurrent} title={t('Clear filters')}><RotateCcw size={15}/><span>{t('Clear filters')}</span><b>{filterReset.count}</b></button>}<div className="header-user"><ProfileAvatar key={avatarUrl} src={avatarUrl} initials={profileInitial} alt={`${user.name || 'User'} profile`} /><div><b>{user.name}</b><small>{user.role==='School Admin'?t('School Principal'):user.role}</small></div></div></header>
      <div className="dashboard-content"><BranchScopeNotice />{isDemoSchool&&<div className="demo-only-banner" role="note"><b>Demo environment</b><span>All records in this school are fictional and must not be used as real student data.</span></div>}{error&&<div className="api-notice"><b>{t('Could not load this page.')}</b><span>{error}</span><button onClick={load}>{t('Try again')}</button></div>}{notice&&<div className="success-notice">{notice}</div>}{pageLoading?<div className="loading-grid"><i/><i/><i/></div>:featureAccess[page]===false?<FeatureUnavailable label={t(page==='payroll'?'Payroll':page==='leave'?'Student Leave Requests and Approvals':page==='smartClassroom'?'Smart Classroom Recording':page==='expenses'?'Expense Management and Vendor Payments':page==='scholarships'?'Scholarship and Concession Management':page==='inventory'?'Inventory Purchase Management':'Hostel Management')} plan={schoolPlan} language={language}/>:page==='academicYears'?<AcademicYearPromotion initialData={data}/>:page==='onboarding'?<OnboardingCenter/>:page==='reports'?<ReportsCenter user={user} language={language}/>:page==='scheduledReports'?<ScheduledReports/>:page==='branches'?<BranchManagement/>:page==='portal'?<ParentStudentPortal user={user}/>:page==='analytics'?<AcademicAnalytics/>:page==='staffHr'?<StaffHRManagement user={user}/>:page==='smartClassroom'?<SmartClassroomManagement user={user}/>:page==='messages'?<MessagingCenter user={user}/>:page==='portalLinks'?<PortalLinkManager/>:page==='calendar'?<SchoolCalendar user={user}/>:page==='meetings'?<ParentTeacherMeetings user={user}/>:page==='audit'?<AuditActivityLog/>:page==='hostel'?<HostelManagement/>:page==='scholarships'?<ScholarshipManagement/>:page==='expenses'?<ExpenseManagement/>:page==='finance'?<FinanceLedger/>:page==='admissions'?<AdmissionManagement/>:page==='documents'?<DocumentExports/>:page==='feeCollection'?<FeeCollectionRequests admin={user?.role === 'School Admin'}/>:page==='overview'&&isPortalUser?<ParentStudentPortal user={user}/>:page==='overview'?<Overview data={data} isSuper={isSuper} onNavigate={moveTo} language={language}/>:page==='people'?<PeopleHub data={data?.data} onNavigate={moveTo} language={language}/>:page==='academics'?<AcademicsHub data={data?.data} onNavigate={moveTo} language={language}/>:page==='publicWebsite'?<SettingsHub data={data?.data} isSuper={isSuper} websiteOnly language={language}/>:page==='settings'?<><SettingsHub data={data?.data} onLogout={onLogout} isSuper={isSuper} language={language}/><ProfileUpdateCard profile={data?.data?.profile} onUpdated={profileUpdated}/><ActiveSessionsCard/></>:page==='maintenance'?<MaintenanceHub/>:page==='attendance'?<Attendance initialData={data} setError={setError} setNotice={setNotice}/>:page==='attendanceReports'?<AttendanceReport initialReport={data}/>:page==='notifications'?<NotificationCenter user={user} setNotice={setNotice}/>:page==='exams'?<ExamManagement user={user}/>:page==='fees'?<FeeManagement user={user}/>:page==='assignments'?<AssignmentManagement/>:page==='library'?<LibraryManagement/>:page==='transport'?<TransportManagement user={user}/>:page==='inventory'?<InventoryManagement/>:page==='leave'?<LeaveManagement user={user} premium={featureAccess.payroll}/>:page==='payroll'?<PayrollManagement/>:page==='subjects'?<SubjectDirectory rows={lists.subjects} canManage={user.role==='School Admin'} reload={load}/>:page==='teacherAssignments'?<TeacherClassAssignmentDirectory rows={lists.teacherAssignments} canManage={user.role==='School Admin'} reload={load}/>:page==='timetable'?<TimetableDirectory rows={lists.timetable} canManage={user.role==='School Admin'} reload={load}/>:<><PageActions page={page} isSuper={isSuper} canCreate={page==='schools'?isSuper:page==='users'?(isSuper||user.role==='School Admin'):page==='teachers'?user.role==='School Admin':canCreate} open={formOpen} setOpen={setFormOpen}/>{formOpen&&page==='students'&&<StudentForm students={lists.students} onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{formOpen&&page==='teachers'&&<TeacherForm onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{formOpen&&page==='parents'&&<ParentForm onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{formOpen&&page==='classes'&&<ClassForm onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{formOpen&&page==='schools'&&<SchoolForm onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{formOpen&&page==='users'&&<UserForm user={user} onDone={message=>{setNotice(message);setFormOpen(false);load()}}/>}{page==='students'?<StudentDirectory rows={lists.students} canDelete={user.role==='School Admin'} reload={load}/>:page==='teachers'?<TeacherDirectory rows={lists.teachers} canManage={user.role==='School Admin'} reload={load}/>:page==='parents'?<ParentDirectory rows={lists.parents} canDelete={user.role==='School Admin'} reload={load}/>:page==='classes'?<ClassDirectory rows={lists.classes} canDelete={user.role==='School Admin'} reload={load}/>:page==='schools'?<SchoolDirectory rows={lists.schools} reload={load}/>:page==='users'?<UserDirectory rows={lists.users} reload={load} language={language}/>:<DataList type={page} rows={lists[page]}/>}</>}</div></main></div>
}

function FeatureUnavailable({label,language}) {
  const t = value => translateUi(language, value)
  return <section className="feature-unavailable"><LockKeyhole/><div><span>{t('Feature unavailable')}</span><h2>{label} {t("isn't included in the plan.")}</h2><p>{t('Ask your super administrator to upgrade this school to unlock the module.')}</p></div></section>
}

function GlobalSearch({ items, onNavigate, canSearchRecords }) {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const localMatches = query.trim().length < 2 ? [] : items.filter(([, label]) => label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)

  useEffect(() => {
    if (!canSearchRecords || query.trim().length < 2) { setRecords([]); setBusy(false); return undefined }
    let active = true
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        const result = await schoolApi.globalSearch(query.trim())
        if (active) setRecords(result.data || [])
      } catch { if (active) setRecords([]) }
      finally { if (active) setBusy(false) }
    }, 240)
    return () => { active = false; clearTimeout(timer) }
  }, [canSearchRecords, query])

  function choose(route) {
    onNavigate(route)
    setQuery('')
    setOpen(false)
  }

  const visible = open && query.trim().length >= 2
  return <div className="global-search"><Search size={17} /><input value={query} onChange={event => { setQuery(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }} placeholder="Search modules or records" aria-label="Search modules or records" role="combobox" aria-expanded={visible} />{query && <button className="global-search-clear" type="button" aria-label="Clear search" title="Clear search" onClick={() => { setQuery(''); setRecords([]); setOpen(false) }}><X size={14}/></button>}{busy && <span className="global-search-status">Searching...</span>}{visible && <div className="global-search-results" role="listbox">{localMatches.map(([Icon, label, key]) => <button key={`module-${key}`} onClick={() => choose(key)} role="option"><Icon size={16} /><span><b>{label}</b><small>Open module</small></span></button>)}{records.map(record => <button key={`${record.type}-${record.id}`} onClick={() => choose(record.route)} role="option"><Search size={16} /><span><b>{record.label}</b><small>{record.detail}</small></span></button>)}{!busy && localMatches.length === 0 && records.length === 0 && <div className="global-search-empty">No matching modules or records.</div>}</div>}</div>
}

function ProfileAvatar({ src, initials, alt }) {
  const [failed, setFailed] = useState(false)
  return <span className="profile-badge" aria-label={alt}>{src && !failed ? <img src={src} alt={alt} onError={() => setFailed(true)} /> : initials}</span>
}

function Overview({data,isSuper,onNavigate,language}) {
  const t = value => translateUi(language, value)
  const stats=data?.stats||{}, role=data?.data?.user?.role
  const schoolReports=data?.data?.school_reports||[], upcoming=data?.data?.upcoming_classes||[]
  const cards=isSuper?[[t('Total Schools'),stats.total_schools??0,t('registered schools'),School],[t('Active Schools'),stats.active_schools??0,t('currently active'),Building2],[t('Total Users'),stats.total_users??0,t('across all schools'),UsersRound],[t('School Admins'),stats.total_admins??0,t('administrators'),ShieldCheck]]:role==='Teacher'?[[t('Students'),stats.total_students??0,t('school records'),UsersRound],[t('Parents'),stats.total_parents??0,t('school records'),HeartHandshake],[t('Classes'),stats.total_classes??0,t('active classes'),BookOpen],[t('Upcoming'),upcoming.length,t('assigned classes'),CalendarCheck]]:[[t('Total Students'),stats.total_students??0,t('enrolled learners'),UsersRound],[t('Total Employees'),stats.total_teachers??0,t('teaching team'),GraduationCap],[t('Total Classes'),stats.total_classes??0,t('active classes'),BookOpen],[t('Attendance'),stats.attendance_percentage??'-',t('today'),CalendarCheck]]
  const actions=isSuper?[[t('Schools'),t('Manage schools'),'schools',School],[t('Users'),t('Manage accounts'),'users',UsersRound],[t('Maintenance'),t('Upgrade school data'),'maintenance',Database]]:role==='Teacher'?[[t('My schedule'),t('View assigned classes'),'academics',CalendarCheck],[t('Students'),t('View student records'),'students',UsersRound],[t('Attendance'),t('View attendance'),'attendance',CalendarCheck]]:[[t('Students'),t('Manage student records'),'students',UsersRound],[t('Employees'),t('Manage teachers and staff'),'teachers',GraduationCap],[t('Class and Section'),t('Manage academic structure'),'classes',BookOpen],[t('Manage Fees'),t('Review fee collection'),'fees',CircleDollarSign],[t('Manage Exam'),t('Manage exams and results'),'exams',Award],[t('Attendance'),t('Mark daily attendance'),'attendance',CalendarCheck]]
  return <><section className="welcome-card"><div><span>{t(isSuper?'Super Admin dashboard':role==='Teacher'?'Teacher dashboard':'School Admin dashboard')}</span><h2>{t(isSuper?'Your school network, clearly organized.':role==='Teacher'?'Your teaching day, clearly organized.':'Your school, clearly organized.')}</h2><p>{t(isSuper?'System-wide information from every registered school.':role==='Teacher'?'Review your upcoming classes and daily school information.':'Live information from your Flask API appears here as your school grows.')}</p></div><GraduationCap /></section><div className="reference-stat-grid">{cards.map(([label,value,note,Icon])=><article key={label}><span><Icon /></span><div><small>{label}</small><b>{value}{label===t('Attendance')&&value!=='-'?'%':''}</b><em>{note}</em></div></article>)}</div><section className="dashboard-actions"><div className="dashboard-section-heading"><span>{t('Administrations')}</span><h2>{t('Quick access')}</h2></div><div className="dashboard-action-grid">{actions.map(([label,note,target,Icon])=><button key={target} onClick={()=>onNavigate(target)}><span><Icon /></span><div><b>{label}</b><small>{note}</small></div><ChevronRight /></button>)}</div></section>
    {isSuper?<section className="data-panel"><div className="panel-title"><div><span>{t('Network report')}</span><h2>{t('Schools and colleges')}</h2></div><b>{schoolReports.length} {t('records')}</b></div><div className="table-wrap"><table><thead><tr><th>{t('School / college')}</th><th>{t('Plan')}</th><th>{t('Admins')}</th><th>{t('Teachers')}</th><th>{t('Students')}</th><th>{t('Parents')}</th><th>{t('Total users')}</th><th>{t('Status')}</th></tr></thead><tbody>{schoolReports.map(row=><tr key={row.id}><td><b>{row.school_name}</b><small>{row.domain}</small></td><td>{row.plan||'-'}</td><td>{row.school_admins}</td><td>{row.teachers}</td><td>{row.students}</td><td>{row.parents}</td><td>{row.total_users}</td><td><span className={`status-pill ${row.status}`}>{row.status}</span></td></tr>)}</tbody></table></div></section>
    :role==='Teacher'?<section className="data-panel"><div className="panel-title"><div><span>{t('Teaching schedule')}</span><h2>{t('Upcoming classes')}</h2></div><b>{upcoming.length} {t('classes')}</b></div>{upcoming.length===0?<div className="empty-state"><CalendarCheck/><h3>{t('No upcoming classes')}</h3><p>{t('Ask the School Admin to connect your login email to a Teacher profile and timetable.')}</p></div>:<div className="table-wrap"><table><thead><tr><th>{t('Day')}</th><th>{t('Time')}</th><th>{t('Class')}</th><th>{t('Subject')}</th><th>{t('Room')}</th></tr></thead><tbody>{upcoming.map(row=><tr key={row.id}><td>{[t('Monday'),t('Tuesday'),t('Wednesday'),t('Thursday'),t('Friday'),t('Saturday'),t('Sunday')][row.weekday]}</td><td><b>{row.start_time} - {row.end_time}</b></td><td>{row.class_name}{row.section?` - ${row.section}`:''}</td><td>{row.subject_name}<small>{row.subject_code}</small></td><td>{row.room||'-'}</td></tr>)}</tbody></table></div>}</section>
    :<section className="empty-panel"><CalendarCheck/><div><h3>{t('Everything starts here')}</h3><p>{t('Use the navigation to view live students, classes and attendance records.')}</p></div></section>}</>
}

function PeopleHub({data,onNavigate,language}) {
  const t = value => translateUi(language, value)
  const stats=data?.statistics||[],recent=data?.recent_joined||[]
  const icons={students:UsersRound,teachers:GraduationCap,parents:HeartHandshake,school_admins:ShieldCheck}
  return <><section className="people-hero"><div><span>{t('People directory')}</span><h2>{t('Everyone in your school, together.')}</h2><p>{t('Live account totals and recently joined members from the People API.')}</p></div><ContactRound/></section><div className="people-stat-grid">{stats.map(item=>{const Icon=icons[item.route]||UsersRound;const target=item.route==='school_admins'?'users':item.route;return <button key={item.id} onClick={()=>onNavigate(target)}><span style={{background:`${item.color}18`,color:item.color}}><Icon/></span><div><small>{t(item.title)}</small><b>{item.count}</b><em>{t('Open directory')} <ChevronRight/></em></div></button>})}</div><section className="data-panel recent-people"><div className="panel-title"><div><span>{t('Latest accounts')}</span><h2>{t('Recently joined')}</h2></div><b>{recent.length} {t('people')}</b></div>{recent.length===0?<div className="empty-state"><ContactRound/><h3>{t('No recent users')}</h3><p>{t('New user accounts will appear here.')}</p></div>:<div className="recent-list">{recent.map(person=><article key={person.id}><span>{person.name.slice(0,2).toUpperCase()}</span><div><b>{person.name}</b><small>{t(person.role)}</small></div><time>{person.created_at}</time></article>)}</div>}</section></>
}

function AcademicsHub({data,onNavigate,language}) {
  const t = value => translateUi(language, value)
  const stats=data?.statistics||[],actions=data?.quick_actions||[],todayClasses=data?.today_classes||[]
  const supported={classes:'classes',subjects:'subjects',attendance:'attendance',timetable:'timetable'}
  return <><section className="people-hero academics-hero"><div><span>{t('Academic workspace')}</span><h2>{t('Teaching and learning, at a glance.')}</h2><p>{t("Live academic totals and today's timetable from this school workspace.")}</p></div><LibraryBig/></section><div className="people-stat-grid academic-stats">{stats.map(item=><article key={item.id}><span style={{background:`${item.color}18`,color:item.color}}><BookOpen/></span><div><small>{t(item.title)}</small><b>{item.count ?? '-'}{item.title==='Attendance'&&item.count != null?'%':''}</b></div></article>)}</div><div className="academic-columns"><section className="data-panel"><div className="panel-title"><div><span>{t('Schedule')}</span><h2>{t("Today's classes")}</h2></div><b>{todayClasses.length} {t('classes')}</b></div>{todayClasses.length===0?<div className="empty-state"><CalendarCheck/><h3>{t('No classes today')}</h3></div>:<div className="class-schedule">{todayClasses.map((item,index)=><article key={`${item.class}-${index}`}><time>{item.time}</time><div><b>{item.subject}</b><small>{item.class} - {item.teacher}</small></div></article>)}</div>}</section><section className="data-panel"><div className="panel-title"><div><span>{t('Shortcuts')}</span><h2>{t('Quick actions')}</h2></div></div><div className="academic-actions">{actions.map(item=><button key={item.route} disabled={!supported[item.route]} onClick={()=>supported[item.route]&&onNavigate(supported[item.route])}><BookOpen/><span><b>{t(item.title)}</b><small>{t(supported[item.route]?'Open module':'Unavailable')}</small></span><ChevronRight/></button>)}</div></section></div></>
}

function SettingsHub({data,onLogout,isSuper=false,websiteOnly=false,language='en'}) { const t=value=>translateUi(language,value); const [passwordOpen,setPasswordOpen]=useState(false); const [content,setContent]=useState(null); const [contentBusy,setContentBusy]=useState(false); const [contentError,setContentError]=useState(''); const [contentSuccess,setContentSuccess]=useState(''); const school=data?.school||{},profile=data?.profile||{}; const items=[['School Profile',Building2,'Available below'],['My Profile',UserRound,'Edit your name and mobile details below'],['Change Password',LockKeyhole,'Update your login password'],['Logout',LogOut,'Sign out of this browser']]; useEffect(()=>{ if(!isSuper) return; const load=async()=>{ try { const result=await schoolApi.publicContent(); setContent(result.data||null) } catch { setContent(null) } }; load(); },[isSuper]); const [form,setForm]=useState({landing_title:'',landing_subtitle:'',contact_email:'',contact_phone:'',contact_address:'',contact_hours:'',contact_message:'',support_email:'',support_phone:'',support_note:'',landingImage:null,storyImage:null,brandLogo:null}); useEffect(()=>{ if(content){ setForm({ landing_title:content.landing_title||'', landing_subtitle:content.landing_subtitle||'', contact_email:content.contact_email||'', contact_phone:content.contact_phone||'', contact_address:content.contact_address||'', contact_hours:content.contact_hours||'', contact_message:content.contact_message||'', support_email:content.support_email||'', support_phone:content.support_phone||'', support_note:content.support_note||'', landingImage:null, brandLogo:null }); } },[content]); async function savePublicContent(event){ event.preventDefault(); setContentBusy(true); setContentError(''); setContentSuccess(''); try { const formData=new FormData(); Object.entries(form).forEach(([key,value])=>{ if(['landingImage','storyImage','brandLogo'].includes(key) && value) formData.append(key,value); else if(value!==null && value!==undefined && value !== '') formData.append(key,String(value)); }); const result=await schoolApi.updatePublicContent(formData); setContent(result.data||null); setContentSuccess(t(result.message||'Public content updated successfully.')); } catch(error){ setContentError(error.message) } finally { setContentBusy(false); } } return <>{!websiteOnly&&<><section className="settings-profile"><span className="settings-logo">{school.logo?<img src={schoolLogoUrl(school.logo)} alt={`${school.name} logo`}/>:<School/>}</span><div><small>School workspace</small><h2>{school.name||'Your school'}</h2><p>{school.domain} - {school.plan||'Standard'} plan</p></div></section><div className="settings-columns"><section className="data-panel profile-details"><div className="panel-title"><div><span>Signed-in account</span><h2>My profile</h2></div></div><dl><div><dt>Name</dt><dd>{profile.name||'-'}</dd></div><div><dt>Email</dt><dd>{profile.email||'-'}</dd></div><div><dt>Role</dt><dd><span className="status-pill">{profile.role||'-'}</span></dd></div><div><dt>School domain</dt><dd>{school.domain||'-'}</dd></div><div><dt>Subscription plan</dt><dd>{school.plan||'-'}</dd></div></dl></section><section className="data-panel"><div className="panel-title"><div><span>Account options</span><h2>Settings</h2></div></div><div className="settings-actions">{items.map(([label,Icon,note])=>{const logout=label==='Logout',password=label==='Change Password',enabled=logout||password;return <button key={label} disabled={!enabled} onClick={logout?onLogout:password?()=>setPasswordOpen(!passwordOpen):undefined}><Icon/><span><b>{label}</b><small>{note}</small></span><ChevronRight/></button>})}</div></section></div></>}{isSuper&&<section className="data-panel website-content-editor"><div className="panel-title"><div><span>{t('Public website')}</span><h2>{t('Landing and contact content')}</h2></div></div><form onSubmit={savePublicContent} className="editor-card"><div className="field-grid two"><label>{t('Landing title')}<input value={form.landing_title} onChange={e=>setForm({...form,landing_title:e.target.value})}/></label><label>{t('Landing subtitle')}<textarea rows="3" value={form.landing_subtitle} onChange={e=>setForm({...form,landing_subtitle:e.target.value})}/></label><label>{t('Landing image')}<input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={e=>setForm({...form,landingImage:e.target.files?.[0]||null})}/></label><label>{t('Story image')}<input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={e=>setForm({...form,storyImage:e.target.files?.[0]||null})}/></label><label>{t('Company logo')}<input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={e=>setForm({...form,brandLogo:e.target.files?.[0]||null})}/></label><label>{t('Contact email')}<input type="email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})}/></label><label>{t('Contact phone')}<input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})}/></label><label>{t('Contact hours')}<input value={form.contact_hours} onChange={e=>setForm({...form,contact_hours:e.target.value})}/></label><label>{t('Support email')}<input type="email" value={form.support_email} onChange={e=>setForm({...form,support_email:e.target.value})}/></label><label>{t('Support phone')}<input value={form.support_phone} onChange={e=>setForm({...form,support_phone:e.target.value})}/></label><label className="wide">{t('Contact address')}<textarea rows="2" value={form.contact_address} onChange={e=>setForm({...form,contact_address:e.target.value})}/></label><label className="wide">{t('Contact message')}<textarea rows="3" value={form.contact_message} onChange={e=>setForm({...form,contact_message:e.target.value})}/></label><label className="wide">{t('Technical support note')}<textarea rows="2" value={form.support_note} onChange={e=>setForm({...form,support_note:e.target.value})}/></label></div>{contentError&&<div className="form-error">{contentError}</div>}{contentSuccess&&<div className="success-notice">{contentSuccess}</div>}<button className="button button-small" disabled={contentBusy}>{contentBusy?t('Saving...'):t('Save public content')}</button></form></section>}{passwordOpen&&<ChangePasswordForm onClose={()=>setPasswordOpen(false)}/>}<div className="placeholder-note"><b>API availability</b><span>Profile information is live. Update your name or mobile details below, change your password, or sign out of this browser.</span></div></> }

function ChangePasswordForm({onClose}) { const [values,setValues]=useState({current_password:'',new_password:'',confirm_password:''}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''); async function submit(e){e.preventDefault();setError('');setSuccess('');if(values.new_password!==values.confirm_password){setError('New password and confirmation do not match.');return}setBusy(true);try{const result=await schoolApi.changePassword({current_password:values.current_password,new_password:values.new_password,confirm_password:values.confirm_password});setSuccess(result.message);setValues({current_password:'',new_password:'',confirm_password:''})}catch(err){setError(err.message)}finally{setBusy(false)}} return <form className="data-panel change-password-card" onSubmit={submit}><div className="panel-title"><div><span>Account security</span><h2>Change password</h2></div><button type="button" className="refresh-button" onClick={onClose}>Close</button></div><div className="password-fields"><label>Current password<input required type="password" value={values.current_password} onChange={e=>setValues({...values,current_password:e.target.value})} autoComplete="current-password"/></label><label>New password<input required type="password" minLength="8" value={values.new_password} onChange={e=>setValues({...values,new_password:e.target.value})} autoComplete="new-password"/><small>At least 8 characters.</small></label><label>Confirm new password<input required type="password" minLength="8" value={values.confirm_password} onChange={e=>setValues({...values,confirm_password:e.target.value})} autoComplete="new-password"/></label></div>{error&&<div className="form-error password-message">{error}</div>}{success&&<div className="success-notice password-message">{success}</div>}<div className="password-submit"><button className="button button-small" disabled={busy}><LockKeyhole size={16}/>{busy?'Updating...':'Update password'}</button></div></form> }

function MaintenanceHub() {
  const [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [result, setResult] = useState(null)
  async function upgrade() {
    setBusy(true); setError(''); setResult(null)
    try { setResult(await schoolApi.upgradeAllSchools()); setConfirmation('') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <><section className="maintenance-hero"><Database/><div><span>Super-admin maintenance</span><h2>Tenant database upgrade</h2><p>Ensure the current compatibility tables exist in every registered school schema.</p></div></section><section className="data-panel maintenance-card"><div className="panel-title"><div><span>Protected operation</span><h2>Upgrade all school schemas</h2></div></div><div className="maintenance-body"><div className="maintenance-warning"><ShieldCheck/><div><b>Run with care</b><p>This operation checks every registered tenant and creates missing compatibility tables. Take a production database backup before maintenance.</p></div></div><label>Type <b>UPGRADE</b> to confirm<input value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="UPGRADE" autoComplete="off"/></label>{error && <div className="form-error">{error}</div>}<button className="button maintenance-button" disabled={busy || confirmation !== 'UPGRADE'} onClick={upgrade}><Database size={17}/>{busy ? 'Upgrading tenant schemas...' : 'Run tenant upgrade'}</button>{result && <div className="upgrade-result"><b>{result.message}</b><span>{result.upgraded_count} school schema(s) checked.</span>{result.schools?.map(s => <small key={s.id}>{s.name} - {s.schema_name}</small>)}</div>}</div></section><OperationsDashboard/></>
}
function UserDirectory({rows,reload,language='en'}) {
  const [editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const t=value=>translateUi(language,value)
  let isSuper
  try { isSuper = JSON.parse(sessionStorage.getItem('school_session') || '{}')?.user?.role === 'super_admin' } catch { isSuper = false }
  if (isSuper) return <SuperAdminUserDirectory initialRows={rows} language={language} />
  const field=(name,value)=>setEditing(current=>({...current,[name]:value}))
  async function save(event){
    event.preventDefault();setBusy(true);setError('');setMessage('')
    try { const payload={name:editing.name,email:editing.email,mobile:editing.mobile,role:editing.role}; const result=await (isSuper?schoolApi.updateUser(editing.id,{...payload,school_domain:editing.school_domain}):schoolApi.updateTenantUser(editing.id,payload));setMessage(result.message);setEditing(null);await reload() }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  async function toggle(user){
    const next=user.status==='active'?'inactive':'active'
    if(!await confirmPopup({title:`${next==='active'?'Activate':'Deactivate'} ${user.name}?`,message:next==='active'?'This user will be able to sign in again.':'This user will no longer be able to sign in.',confirmLabel:next==='active'?'Activate user':'Deactivate user',tone:next==='active'?'primary':'danger'})) return
    setBusy(true);setError('');setMessage('')
    try { const result=await (isSuper?schoolApi.updateUserStatus(user.id,{status:next,school_domain:user.school_domain}):schoolApi.updateTenantUserStatus(user.id,{status:next}));setMessage(result.message);await reload() }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <section className="data-panel user-directory"><div className="panel-title"><div><span>{t('Account management')}</span><h2>{t('User directory')}</h2></div><b>{rows.length} records</b></div>{error&&<div className="form-error user-directory-message">{error}</div>}{message&&<div className="success-notice user-directory-message">{message}</div>}{rows.length===0?<div className="empty-state"><UsersRound/><h3>No users found</h3><p>Create a user account to see it here.</p></div>:<div className="table-wrap"><table><thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Mobile')}</th><th>{t('Role')}</th><th>{t('School')}</th><th>{t('Created')}</th><th>{t('Status')}</th><th>{t('Actions')}</th></tr></thead><tbody>{rows.map(row=><tr key={`${row.school_domain}-${row.id}`}><td><b>{row.name}</b></td><td>{row.email}</td><td>{row.mobile||'-'}</td><td>{t(row.role)}</td><td>{row.school_name||row.school_domain}</td><td>{row.created_at?new Date(row.created_at).toLocaleString():'-'}</td><td><span className={`status-pill ${row.status==='inactive'?'inactive':''}`}>{t(row.status==='inactive'?'Inactive':'Active')}</span></td><td><div className="student-row-actions"><button onClick={()=>setEditing({...row})} disabled={busy}><Edit3/>{t('Edit')}</button><button className={row.status==='active'?'danger':'activate'} onClick={()=>toggle(row)} disabled={busy}>{row.status==='active'?<PowerOff/>:<Power/>}{row.status==='active'?t('Deactivate'):t('Activate')}</button></div></td></tr>)}</tbody></table></div>}{editing&&<form className="user-edit-form" onSubmit={save}><div className="field-grid three"><label>Name *<input required value={editing.name||''} onChange={event=>field('name',event.target.value)}/></label><label>Email *<input required type="email" value={editing.email||''} onChange={event=>field('email',event.target.value)}/></label><label>Mobile *<input required value={editing.mobile||''} onChange={event=>field('mobile',phoneValue(event.target.value))}/></label><label>Role *<select value={editing.role||''} onChange={event=>field('role',event.target.value)}><option>School Admin</option><option>Teacher</option><option>Student</option><option>Parent</option></select></label><label>School<input readOnly value={editing.school_name||editing.school_domain||''}/></label></div><div className="student-row-actions"><button className="button button-small" disabled={busy}><Save/>{busy?'Saving...':'Save user'}</button><button type="button" onClick={()=>setEditing(null)}>{t('Cancel')}</button></div></form>}</section>
}

function DataList({type,rows}) { const title=type==='users'?'User':type.charAt(0).toUpperCase()+type.slice(1); return <section className="data-panel"><div className="panel-title"><div><h2>{title} directory</h2></div><b>{rows.length} records</b></div>{rows.length===0?<div className="empty-state"><UsersRound/><h3>No {type} found</h3><p>New records created through the API will appear here.</p></div>:<div className="table-wrap"><table><thead><tr><th>Name / title</th><th>Details</th><th>Status</th></tr></thead><tbody>{rows.map((row,i)=><tr key={row.id??i}><td><div className={type==='schools'?'school-cell':''}>{type==='schools'&&<span className="school-logo">{row.logoPath?<img src={schoolLogoUrl(row.logoPath)} alt={`${row.schoolName} logo`} onError={e=>{e.currentTarget.style.display='none'}}/>:<School/>}</span>}<div><b>{row.first_name ? `${row.first_name} ${row.last_name||''}` : row.father_name||row.mother_name||row.full_name||row.class_name||row.name||row.schoolName||row.domain||`Record ${i+1}`}</b><small>{row.email||row.adminEmail||row.mobile||row.teacher_id||row.admission_no||row.description||''}</small></div></div></td><td>{type==='users'?<><b>{row.role||'User'}</b><small className="user-school-context">{row.school_name||row.school_domain||'School not assigned'}</small><small className="user-contact">Mobile: {row.mobile||'-'}</small><small className="user-created">Created: {row.created_at?new Date(row.created_at).toLocaleString():'-'}</small></>:row.father_name&&row.mother_name?`Mother: ${row.mother_name}`:row.department||row.role||row.section||row.domain||row.planSetup||row.plan_setup||row.address||'-'}</td><td><span className="status-pill">{row.status||'Active'}</span></td></tr>)}</tbody></table></div>}</section> }
function PageActions({page,canCreate,open,setOpen,isSuper=false}) { if(!canCreate||!['students','teachers','parents','classes','schools','users'].includes(page)) return null; const label=page==='students'?'student':page==='teachers'?'teacher':page==='parents'?'parent':page==='classes'?'class':page==='schools'?'school':page==='users'&&isSuper?'School Admin':'user'; const description=page==='users'&&isSuper?'Manage login accounts here. Each row is a person’s account. Manage school profiles under Schools.':page==='schools'?'Add school profiles here. Then create its School Admin login under Users.':'Add new records directly to your school API.'; return <div className="page-actions"><p>{description}</p><button className="button button-small" onClick={()=>setOpen(!open)}>{open?<X size={17}/>:<Plus size={17}/>} {open?'Close form':`Add ${label}`}</button></div> }

function studentRowsFromResponse(result) {
  const candidates = [result?.students, result?.data?.students, result?.data, result?.items]
  return candidates.find(Array.isArray) || []
}

function ParentForm({onDone}) {
  const [students,setStudents]=useState([]),[loadingStudents,setLoadingStudents]=useState(true)
  const [values,setValues]=useState({account_name:'',father_name:'',mother_name:'',student_id:'',relationship_type:'guardian',mobile:'+91',email:'',password:'',address:''})
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[loadError,setLoadError]=useState('')
  useEffect(()=>{let active=true;schoolApi.students({per_page:200}).then(result=>{if(active)setStudents(studentRowsFromResponse(result))}).catch(err=>{if(active)setLoadError(err.message)}).finally(()=>{if(active)setLoadingStudents(false)});return()=>{active=false}},[])
  const field=(name,value)=>setValues(current=>({...current,[name]:value}))
  const activeStudents=students.filter(item=>String(item.status||'').trim().toLowerCase()==='active'||item.is_active===true||item.is_active===1)
  const valid=Boolean(values.account_name.trim()&&(values.father_name.trim()||values.mother_name.trim())&&values.student_id&&phoneOk(values.mobile)&&emailOk(values.email)&&values.password.length>=8)
  async function submit(e){e.preventDefault();if(!valid)return;setBusy(true);setError('');try{const {account_name,password,...parent}=values;const result=await schoolApi.createParent({...parent,name:account_name,student_id:Number(values.student_id),portal_password:password});onDone(result.message||'Parent account created and linked to the student.')}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <form className="editor-card" onSubmit={submit}>
    <div className="editor-heading"><HeartHandshake/><div><h3>Create a parent account</h3><p>Select the student this Parent can access. Their login will use the email and password entered here.</p></div></div>
    <div className="field-grid three">
      <label>Parent / guardian name *<input required value={values.account_name} onChange={e=>field('account_name',e.target.value)}/></label>
      <label>Student *<select required value={values.student_id} disabled={loadingStudents||activeStudents.length===0} onChange={e=>field('student_id',e.target.value)}><option value="">{loadingStudents?'Loading students...':activeStudents.length?'Select a student':'No active students found'}</option>{activeStudents.map(student=><option key={student.id} value={student.id}>{student.first_name} {student.last_name||''} · {student.admission_no} · {student.class_name||'No class'} {student.section||''}</option>)}</select></label>
      <label>Relationship to student *<select required value={values.relationship_type} onChange={e=>field('relationship_type',e.target.value)}><option value="guardian">Guardian</option><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select></label>
      <label>Father name<input value={values.father_name} onChange={e=>field('father_name',e.target.value)}/></label>
      <label>Mother name<input value={values.mother_name} onChange={e=>field('mother_name',e.target.value)}/></label>
      <label>Mobile *<input type="tel" inputMode="tel" autoComplete="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Enter 10 digits; Indian mobile numbers must start with 6, 7, 8, or 9." required value={values.mobile} onChange={e=>field('mobile',phoneValue(e.target.value))}/><small className="field-help">10 digits, starting with 6–9.</small></label>
      <label>Parent login email *<input type="email" autoComplete="email" required value={values.email} onChange={e=>field('email',e.target.value)}/></label>
      <label>Temporary password *<input type="password" minLength="8" autoComplete="new-password" required value={values.password} onChange={e=>field('password',e.target.value)} placeholder="At least 8 characters"/></label>
      <label className="wide">Address<textarea rows="3" value={values.address} onChange={e=>field('address',e.target.value)}/></label>
    </div>
    {values.mobile!=='+91'&&!phoneOk(values.mobile)&&<div className="form-error">Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.</div>}
    {values.email&&!emailOk(values.email)&&<div className="form-error">Enter a valid email address.</div>}
    {!(values.father_name.trim()||values.mother_name.trim())&&<div className="field-help">Enter at least the father or mother name for the parent record.</div>}
    {loadError&&<div className="form-error">Could not load students: {loadError}</div>}
    {!loadingStudents&&activeStudents.length===0&&!loadError&&<div className="field-help">Add an active student first, then create this Parent account.</div>}
    {error&&<div className="form-error">{error}</div>}
    <button className="button button-small" disabled={busy||loadingStudents||!valid}><Save size={16}/>{busy?'Creating account...':'Create parent account'}</button>
  </form>
}

function TeacherForm({onDone}) { const empty={full_name:'',email:'',temporary_password:'',phone:'',gender:'',address:'',employment_type:'Full-time',joining_date:'',department:'',role:'Teacher',section:'',photo:null}; const [values,setValues]=useState(empty),[busy,setBusy]=useState(false),[error,setError]=useState(''); const field=(name,value)=>setValues({...values,[name]:value}); async function submit(e){e.preventDefault();if(values.phone&&!phoneOk(values.phone)){setError('Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.');return}setBusy(true);setError('');try{const result=await schoolApi.createTeacher(values);onDone(result.message||'Teacher onboarded successfully.')}catch(err){setError(err.message)}finally{setBusy(false)}} return <form className="editor-card" onSubmit={submit}><div className="editor-heading"><GraduationCap/><div><h3>Onboard a teacher with login</h3><p>Create one connected professional profile and Teacher login account.</p></div></div><div className="field-grid three"><label>Full name *<input required value={values.full_name} onChange={e=>field('full_name',e.target.value)}/></label><label>Email *<input required type="email" value={values.email} onChange={e=>field('email',e.target.value)}/></label><label>Temporary login password<input type="password" minLength="8" value={values.temporary_password} onChange={e=>field('temporary_password',e.target.value)} placeholder="Required for a new login"/><small className="field-help">Leave blank only when a Teacher login with this email already exists.</small></label><label>Phone<input type="tel" inputMode="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Optional. If entered, use 10 digits starting with 6, 7, 8, or 9." value={values.phone} onChange={e=>field('phone',phoneValue(e.target.value))}/></label><label>Gender<select value={values.gender} onChange={e=>field('gender',e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Employment type<select value={values.employment_type} onChange={e=>field('employment_type',e.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Visiting</option></select></label><label>Joining date<input type="date" value={values.joining_date} onChange={e=>field('joining_date',e.target.value)}/></label><label>Department<input value={values.department} onChange={e=>field('department',e.target.value)} placeholder="Science"/></label><label>Designation<input value={values.role} onChange={e=>field('role',e.target.value)} placeholder="Teacher"/></label><label>Section<input value={values.section} onChange={e=>field('section',e.target.value)} placeholder="A"/></label><label>Photo<input type="file" accept="image/*" onChange={e=>field('photo',e.target.files[0])}/></label><label className="wide">Address<textarea rows="2" value={values.address} onChange={e=>field('address',e.target.value)}/></label></div>{values.phone&&!phoneOk(values.phone)&&<div className="form-error">Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.</div>}{error&&<div className="form-error">{error}</div>}<button className="button button-small" disabled={busy||Boolean(values.phone&&!phoneOk(values.phone))}><Save size={16}/>{busy?'Onboarding...':'Create teacher and login'}</button></form> }

function SuperAdminUserDirectory({initialRows=[]}) {
  const [rows,setRows]=useState(initialRows),[statusTab,setStatusTab]=useState('active'),[search,setSearch]=useState(''),[plan,setPlan]=useState('all'),[role,setRole]=useState('all'),[filterOptions,setFilterOptions]=useState({roles:[]}),[pagination,setPagination]=useState({page:1,per_page:10,total:initialRows.length,total_pages:1}),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const load=useCallback(async(nextPage=1)=>{setBusy(true);setError('');try{const result=await schoolApi.users(true,{status:statusTab,search,plan,role,page:nextPage,per_page:10});setRows(result.users||[]);setFilterOptions(result.filters||{roles:[]});setPagination(result.pagination||{page:nextPage,per_page:10,total:(result.users||[]).length,total_pages:1})}catch(requestError){setError(requestError.message)}finally{setBusy(false)}},[statusTab,search,plan,role])
  useEffect(()=>{const timer=setTimeout(()=>load(1),180);return()=>clearTimeout(timer)},[load])
  async function save(event){event.preventDefault();setBusy(true);setError('');setMessage('');try{const result=await schoolApi.updateUser(editing.id,{name:editing.name,email:editing.email,mobile:editing.mobile,role:editing.role,school_domain:editing.school_domain});setEditing(null);setMessage(result.message);await load(pagination.page)}catch(requestError){setError(requestError.message)}finally{setBusy(false)}}
  async function toggle(user){const next=user.status==='active'?'inactive':'active';if(!await confirmPopup({title:`${next==='active'?'Activate':'Deactivate'} ${user.name}?`,message:next==='active'?'This user will be able to sign in again.':'This user will no longer be able to sign in.',confirmLabel:next==='active'?'Activate user':'Deactivate user',tone:next==='active'?'primary':'danger'}))return;setBusy(true);setError('');setMessage('');try{const result=await schoolApi.updateUserStatus(user.id,{status:next,school_domain:user.school_domain});setMessage(result.message);await load(pagination.page)}catch(requestError){setError(requestError.message)}finally{setBusy(false)}}
  async function resetMfa(user){if(!await confirmPopup({title:`Reset MFA for ${user.name}?`,message:'The user will need to enroll a new authenticator on the next sign-in.',confirmLabel:'Reset MFA',tone:'danger'}))return;setBusy(true);setError('');setMessage('');try{const result=await schoolApi.mfaAdminReset(user.school_id,user.id);setMessage(result.message);await load(pagination.page)}catch(requestError){setError(requestError.message)}finally{setBusy(false)}}
  const roles=filterOptions.roles?.length?filterOptions.roles:['School Admin','Accounts Staff','Hostel Staff']
  const resetPage=setter=>value=>{setter(value);setPagination(current=>({...current,page:1}))}
  function clearFilters(){setStatusTab('active');setSearch('');setPlan('all');setRole('all');setPagination(current=>({...current,page:1}))}
  const activeFilterCount=Number(statusTab!=='active')+Number(Boolean(search.trim()))+Number(plan!=='all')+Number(role!=='all')
  useFilterReset(clearFilters,activeFilterCount)
  return <section className="data-panel user-directory"><div className="panel-title"><div><span>Account management</span><h2>User directory</h2></div><b>{pagination.total} records</b></div><div className="school-directory-toolbar user-directory-toolbar"><div className="school-status-tabs"><button className={statusTab==='active'?'active':''} onClick={()=>{setStatusTab('active');setPagination(current=>({...current,page:1}))}}>Active users</button><button className={statusTab==='inactive'?'active':''} onClick={()=>{setStatusTab('inactive');setPagination(current=>({...current,page:1}))}}>Deactivated users</button></div><div className="school-directory-filters user-directory-filters"><label className="school-search"><Search size={16}/><input value={search} onChange={resetPage(setSearch)} placeholder="Search name, email or mobile"/></label><label><span>Plan</span><select value={plan} onChange={resetPage(setPlan)}><option value="all">All plans</option><option value="trial">Trial</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option></select></label><label><span>Role</span><select value={role} onChange={resetPage(setRole)}><option value="all">All roles</option>{roles.map(item=><option key={item} value={item}>{item}</option>)}</select></label></div></div>{error&&<div className="form-error user-directory-message">{error}</div>}{message&&<div className="success-notice user-directory-message">{message}</div>}{rows.length===0?<div className="empty-state"><UsersRound/><h3>{statusTab==='active'?'No active users found':'No deactivated users found'}</h3><p>Adjust the search or filters to find a user.</p></div>:<div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Plan</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row=><tr key={`${row.school_domain}-${row.id}`}><td><b>{row.name}</b></td><td>{row.email}</td><td>{row.mobile||'-'}</td><td>{row.role}</td><td>{row.school_plan||'Standard'}</td><td>{row.created_at?new Date(row.created_at).toLocaleString():'-'}</td><td><span className={`status-pill ${row.status==='inactive'?'inactive':''}`}>{row.status||'active'}</span></td><td><div className="student-row-actions"><button onClick={()=>setEditing({...row})} disabled={busy}><Edit3/>Edit</button><button className={row.status==='active'?'danger':'activate'} onClick={()=>toggle(row)} disabled={busy}>{row.status==='active'?<PowerOff/>:<Power/>}{row.status==='active'?'Deactivate':'Activate'}</button><button className="danger" onClick={()=>resetMfa(row)} disabled={busy}><ShieldCheck/>Reset MFA</button></div></td></tr>)}</tbody></table></div>}<div className="school-pagination"><span>Page {pagination.page} of {pagination.total_pages}</span><div><button onClick={()=>load(1)} disabled={busy||pagination.page<=1} aria-label="First page" title="First page"><ChevronFirst/></button><button onClick={()=>load(pagination.page-1)} disabled={busy||pagination.page<=1} aria-label="Previous page" title="Previous page"><ChevronLeft/></button><button onClick={()=>load(pagination.page+1)} disabled={busy||pagination.page>=pagination.total_pages} aria-label="Next page" title="Next page"><ChevronRight/></button><button onClick={()=>load(pagination.total_pages)} disabled={busy||pagination.page>=pagination.total_pages} aria-label="Last page" title="Last page"><ChevronLast/></button></div></div>{editing&&<form className="user-edit-form" onSubmit={save}><div className="editor-heading"><UsersRound/><div><h3>Edit user</h3><p>Update this user account.</p></div><button type="button" className="refresh-button" onClick={()=>setEditing(null)}>Close</button></div><div className="field-grid three"><label>Name *<input required value={editing.name||''} onChange={event=>setEditing({...editing,name:event.target.value})}/></label><label>Email *<input required type="email" value={editing.email||''} onChange={event=>setEditing({...editing,email:event.target.value})}/></label><label>Mobile *<input required value={editing.mobile||''} onChange={event=>setEditing({...editing,mobile:phoneValue(event.target.value)})}/></label><label>Role *<select value={editing.role||''} onChange={event=>setEditing({...editing,role:event.target.value})}>{roles.map(item=><option key={item}>{item}</option>)}</select></label></div><div className="student-row-actions"><button className="button button-small" disabled={busy}><Save/>{busy?'Saving...':'Save user'}</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form>}</section>
}

const notificationTypes=[['visit','Visit follow-up'],['registration','New registration'],['class-update','Class update'],['parent-meeting','Parent meeting'],['meeting-reminder','Meeting reminder']]
function NotificationCenter({user,setNotice}) {
  const [type,setType]=useState('visit'),[values,setValues]=useState({phone_number:'',name:'',school_name:user.school_name||'',student_name:'',class_name:'',details:'',parent_name:'',teacher_name:'',meeting_date:'',meeting_time:'',target_role:'parent'}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[history,setHistory]=useState([]),[historyBusy,setHistoryBusy]=useState(true)
  const field=(name,value)=>setValues({...values,[name]:value})
  const loadHistory=useCallback(async()=>{setHistoryBusy(true);try{const result=await schoolApi.notificationHistory();setHistory(result.data||[])}catch(err){setError(err.message)}finally{setHistoryBusy(false)}},[])
  useEffect(()=>{const timer=setTimeout(loadHistory,0);return()=>clearTimeout(timer)},[loadHistory])
  async function submit(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{const result=await schoolApi.sendNotification(type,values);const delivery=result.whatsapp?.success?'WhatsApp delivery accepted.':result.whatsapp?.message||'Notification recorded; check WhatsApp configuration.';setNotice(`${result.message} ${delivery}`);await loadHistory()}catch(err){setError(err.message)}finally{setBusy(false)}}
  const nameFields=['visit','registration'].includes(type),classFields=type==='class-update',meetingFields=type==='parent-meeting',reminder=type==='meeting-reminder'
  return <><NotificationPreferences /><NotificationQueue user={user}/><div className="notification-layout"><aside className="notification-types"><span>Send immediately</span>{notificationTypes.map(([key,label])=><button key={key} className={type===key?'active':''} onClick={()=>{setType(key);setError('')}}><BellRing/>{label}</button>)}</aside><form className="editor-card notification-form" onSubmit={submit}><div className="editor-heading"><Send/><div><h3>{notificationTypes.find(item=>item[0]===type)?.[1]}</h3><p>Compose and send this message immediately through WhatsApp.</p></div></div><div className="field-grid"><label>Recipient phone *<input required value={values.phone_number} onChange={e=>field('phone_number',e.target.value.replace(/[^0-9+]/g,''))} placeholder="919876543210"/><small className="field-help">Include country code without spaces.</small></label><label>Target role<select value={values.target_role} onChange={e=>field('target_role',e.target.value)}><option value="parent">Parent</option><option value="student">Student</option><option value="teacher">Teacher</option></select></label>{nameFields&&<><label>Parent/guardian name<input value={values.name} onChange={e=>field('name',e.target.value)}/></label><label>Student name<input value={values.student_name} onChange={e=>field('student_name',e.target.value)}/></label><label className="wide">School name<input value={values.school_name} onChange={e=>field('school_name',e.target.value)}/></label></>}{classFields&&<><label>Class name<input value={values.class_name} onChange={e=>field('class_name',e.target.value)}/></label><label className="wide">Update details<textarea required rows="4" value={values.details} onChange={e=>field('details',e.target.value)}/></label></>}{meetingFields&&<><label>Parent name<input value={values.parent_name} onChange={e=>field('parent_name',e.target.value)}/></label><label>Teacher name<input value={values.teacher_name} onChange={e=>field('teacher_name',e.target.value)}/></label><label>Meeting date<input required type="date" value={values.meeting_date} onChange={e=>field('meeting_date',e.target.value)}/></label><label>Meeting time<input required type="time" value={values.meeting_time} onChange={e=>field('meeting_time',e.target.value)}/></label></>}{reminder&&<label>Meeting date<input required type="date" value={values.meeting_date} onChange={e=>field('meeting_date',e.target.value)}/></label>}</div>{error&&<div className="form-error">{error}</div>}<button className="button" disabled={busy}><Send size={17}/>{busy?'Sending...':'Send notification'}</button></form></div><NotificationHistory rows={history} busy={historyBusy} reload={loadHistory}/><UserNotificationLookup defaultUserId={user.id}/></>
}

function NotificationHistory({rows,busy,reload}) { return <section className="data-panel notification-history"><div className="panel-title"><div><span>Tenant message log</span><h2>Recent notification history</h2></div><button className="refresh-button" onClick={reload} disabled={busy}>{busy?'Loading...':'Refresh'}</button></div>{busy&&rows.length===0?<div className="history-loading">Loading notification history</div>:rows.length===0?<div className="empty-state"><BellRing/><h3>No notifications sent yet</h3><p>Your sent message attempts will appear here.</p></div>:<div className="history-list">{rows.map(row=><article key={row.id}><span className={`delivery-dot ${row.status}`}/><div><b>{row.title}</b><p>{row.message}</p><small>{row.phone_number||'No phone'} - {row.created_at?new Date(row.created_at).toLocaleString():'Unknown time'}</small></div><span className={`delivery-status ${row.status}`}>{row.status}</span></article>)}</div>}</section> }

function UserNotificationLookup({defaultUserId}) { const [userId,setUserId]=useState(defaultUserId||''),[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[searched,setSearched]=useState(false),[error,setError]=useState(''); async function submit(e){e.preventDefault();setBusy(true);setError('');try{const result=await schoolApi.notificationsByUser(userId);setRows(result.data||[]);setSearched(true)}catch(err){setError(err.message)}finally{setBusy(false)}} return <section className="data-panel user-notification-lookup"><div className="panel-title"><div><span>Individual inbox API</span><h2>Find notifications by user ID</h2></div></div><form onSubmit={submit}><label>User ID<input required type="number" min="1" value={userId} onChange={e=>setUserId(e.target.value)}/></label><button className="button button-small" disabled={busy}>{busy?'Searching...':'Search user notifications'}</button></form>{error&&<div className="form-error lookup-error">{error}</div>}{searched&&(rows.length?<div className="history-list">{rows.map(row=><article key={row.id}><span className={`delivery-dot ${row.status}`}/><div><b>{row.title}</b><p>{row.message}</p><small>{row.phone_number||'No phone'} - {row.created_at?new Date(row.created_at).toLocaleString():'Unknown time'}</small></div><span className={`delivery-status ${row.status}`}>{row.status}</span></article>)}</div>:<div className="lookup-empty">No notifications are linked to user ID {userId}.</div>)}</section> }

function UserForm({ user, onDone }) {
  const isSuper = user.role === 'super_admin'
  const roles = isSuper
    ? ['School Admin']
    : user.role === 'School Admin'
      ? ['Teacher', 'Student', 'Parent', 'Hostel Staff', 'Accounts Staff', 'Driver']
      : []
  const [schools, setSchools] = useState([])
  const [loadingSchools, setLoadingSchools] = useState(isSuper)
  const [values, setValues] = useState({
    name: '',
    email: '',
    mobile: '+91',
    school_domain: user.school_domain || '',
    password: '',
    role: roles[0],
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordMismatch = isSuper && confirmPassword.length > 0 && values.password !== confirmPassword

  useEffect(() => {
    if (!isSuper) return undefined
    let cancelled = false
    setLoadingSchools(true)
    schoolApi.schoolAdminOptions()
      .then(result => { if (!cancelled) setSchools(result.schools || []) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoadingSchools(false) })
    return () => { cancelled = true }
  }, [isSuper])

  const field = (name, value) => setValues(current => ({ ...current, [name]: value }))
  const selectSchool = domain => {
    const school = schools.find(item => item.domain === domain)
    setValues(current => ({
      ...current,
      school_domain: domain,
      email: school?.adminEmail || '',
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (isSuper && values.password !== confirmPassword) {
      setError('Password and confirmation do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.createUser(values)
      onDone(result.message || 'User account created successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <form className="editor-card" onSubmit={submit}>
    <div className="editor-heading"><UsersRound /><div><h3>{isSuper ? 'Create a School Admin' : 'Create a user account'}</h3><p>{isSuper ? 'Choose a school. Its saved login email will be used for this Admin account.' : 'Permissions are limited automatically by your logged-in role.'}</p></div></div>
    <div className="field-grid three">
      {isSuper ? <>
        <label>School *<select required value={values.school_domain} onChange={event => selectSchool(event.target.value)}><option value="">Select a school</option>{schools.map(school => <option key={school.id} value={school.domain}>{school.schoolName}</option>)}</select></label>
        <label>School login email *<input required type="email" value={values.email} readOnly placeholder="Select a school first" /></label>
        <label>Admin full name *<input required value={values.name} onChange={event => field('name', event.target.value)} /></label>
        <label>Mobile *<input type="tel" inputMode="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Enter 10 digits; Indian mobile numbers must start with 6, 7, 8, or 9." required value={values.mobile} onChange={event => field('mobile', phoneValue(event.target.value))} /><small className="field-help">10 digits, starting with 6–9.</small></label>
        <label>Role<input value="School Admin" readOnly /></label>
        <label>Temporary password *<span className="password-input-control"><input required type={showPassword ? 'text' : 'password'} minLength="8" value={values.password} onChange={event => field('password', event.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span><small className="field-help">The Admin will change it at first login.</small></label>
        <label>Confirm password *<span className="password-input-control"><input required type={showConfirmPassword ? 'text' : 'password'} minLength="8" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Enter the password again" autoComplete="new-password" aria-invalid={passwordMismatch} /><button type="button" onClick={() => setShowConfirmPassword(current => !current)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmPassword} title={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{passwordMismatch && <small className="field-help password-mismatch">Passwords do not match.</small>}</label>
      </> : <>
        <label>Full name *<input required value={values.name} onChange={event => field('name', event.target.value)} /></label>
        <label>Email *<input required type="email" value={values.email} onChange={event => field('email', event.target.value)} /></label>
        <label>Mobile *<input type="tel" inputMode="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Enter 10 digits; Indian mobile numbers must start with 6, 7, 8, or 9." required value={values.mobile} onChange={event => field('mobile', phoneValue(event.target.value))} /><small className="field-help">10 digits, starting with 6–9.</small></label>
        <label>School *<input value={values.school_domain} readOnly /></label>
        <label>Role *<select value={values.role} onChange={event => field('role', event.target.value)}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
        <label>Temporary password *<input required type="password" minLength="8" value={values.password} onChange={event => field('password', event.target.value)} placeholder="Minimum 8 characters" /></label>
      </>}
    </div>
    {isSuper && !loadingSchools && schools.length === 0 && <div className="field-help">No eligible schools found. Go to Schools, add or edit a school, save its School login email, and set it to Active. Schools that already have a School Admin will not appear here.</div>}
    {values.email && !emailOk(values.email) && <div className="form-error">Enter a valid email address.</div>}
    {values.mobile && values.mobile !== '+91' && !phoneOk(values.mobile) && <div className="form-error">Enter a valid Indian mobile number.</div>}
    {error && <div className="form-error">{error}</div>}
    <button className="button button-small" disabled={busy || loadingSchools || !phoneOk(values.mobile) || (isSuper && (schools.length === 0 || !confirmPassword || passwordMismatch))}><Save size={16} />{busy ? 'Creating account...' : isSuper ? 'Create School Admin' : 'Create user account'}</button>
  </form>
}

function SchoolForm({ onDone }) {
  const [schools, setSchools] = useState([])
  const [values, setValues] = useState({ schoolName: '', domain: '', adminEmail: '', planSetup: 'Standard', logo: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { schoolApi.schools().then(result => setSchools(result.schools || [])).catch(() => setSchools([])) }, [])
  const domains = new Set(schools.map(school => (school.domain || '').toLowerCase()))
  const suggested = values.domain && domains.has(values.domain) ? recommendedDomain(values.domain, domains) : ''
  const field = (name, value) => setValues(current => ({ ...current, [name]: name === 'domain' ? domainValue(value) : value }))

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.createSchool(values)
      onDone(`${result.message || 'School created successfully.'} Next, create its School Admin from User Management.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <form className="editor-card" onSubmit={submit}>
    <div className="editor-heading"><School /><div><h3>Add a school</h3><p>Save the school details and login email now. Create its Admin account separately afterward.</p></div></div>
    <div className="field-grid">
      <label>School name *<input required value={values.schoolName} onChange={event => field('schoolName', event.target.value)} placeholder="Green Valley School" /></label>
      <label>Unique domain *<input required value={values.domain} onChange={event => field('domain', event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="green-valley" /><small className="field-help">{suggested ? `Domain already exists. Recommended: ${suggested}` : 'Used by staff when signing in.'}</small>{suggested && <button type="button" className="text-action" onClick={() => field('domain', suggested)}>Use recommended domain</button>}</label>
      <label>School login email *<input required type="email" value={values.adminEmail} onChange={event => field('adminEmail', event.target.value)} placeholder="office@school.com" /><small className="field-help">This email becomes the School Admin login email.</small></label>
      <label>Plan *<select value={values.planSetup} onChange={event => field('planSetup', event.target.value)}><option>Trial</option><option>Standard</option><option>Premium</option><option>Enterprise</option></select></label>
      <label className="wide">School logo *<input required type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={event => field('logo', event.target.files[0])} /><small className="field-help">PNG, JPG or JPEG.</small></label>
    </div>
    {values.adminEmail && !emailOk(values.adminEmail) && <div className="form-error">Enter a valid school login email.</div>}
    {error && <div className="form-error">{error}</div>}
    <button className="button button-small" disabled={busy}><Save size={16} />{busy ? 'Creating school...' : 'Add school'}</button>
  </form>
}

function ClassForm({onDone}) { const [values,setValues]=useState({class_name:'',description:''}),[busy,setBusy]=useState(false),[error,setError]=useState(''); async function submit(e){e.preventDefault();setBusy(true);setError('');try{const result=await schoolApi.createClass(values);onDone(result.message||'Class created successfully.')}catch(err){setError(err.message)}finally{setBusy(false)}} return <form className="editor-card" onSubmit={submit}><div className="editor-heading"><BookOpen/><div><h3>Create a class</h3><p>Add a class to the current school workspace.</p></div></div><div className="field-grid"><label>Class name<input required value={values.class_name} onChange={e=>setValues({...values,class_name:e.target.value})} placeholder="Example: Grade 8"/></label><label>Description<input value={values.description} onChange={e=>setValues({...values,description:e.target.value})} placeholder="Optional class description"/></label></div>{error&&<div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save size={16}/>{busy?'Creating...':'Create class'}</button></form> }

function StudentForm({onDone,students=[]}) {
  const empty={admission_no:'',first_name:'',last_name:'',gender:'',dob:'',mobile:'',email:'',father_name:'',mother_name:'',class_name:'',address:'',photo:null}
  const [values,setValues]=useState(empty),[classes,setClasses]=useState([]),[loadingClasses,setLoadingClasses]=useState(true),[classError,setClassError]=useState(''),[sectionChoice,setSectionChoice]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const field=(name,value)=>setValues(current=>({...current,[name]:value}))
  useEffect(()=>{let cancelled=false;schoolApi.classes({status:'active',per_page:200}).then(result=>{if(!cancelled)setClasses(result.data||[])}).catch(err=>{if(!cancelled)setClassError(err.message)}).finally(()=>{if(!cancelled)setLoadingClasses(false)});return()=>{cancelled=true}},[])
  const sections=[...new Set([...COMMON_SECTIONS,...students.filter(student=>student.class_name===values.class_name).map(student=>(student.section||'').trim()).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}))
  const selectedSection=sectionChoice
  async function submit(e){e.preventDefault();if(values.mobile&&!phoneOk(values.mobile)){setError('Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.');return}setBusy(true);setError('');try{const result=await schoolApi.createStudent({...values,section:selectedSection});onDone(result.message||'Student registered successfully.')}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <form className="editor-card" onSubmit={submit}>
    <div className="editor-heading"><UsersRound/><div><h3>Register a student</h3><p>Choose a class from the school setup. Sections are listed for the selected class.</p></div></div>
    <div className="field-grid three">
      <label>Admission number *<input required value={values.admission_no} onChange={e=>field('admission_no',e.target.value)} /></label>
      <label>First name *<input required value={values.first_name} onChange={e=>field('first_name',e.target.value)} /></label>
      <label>Last name<input value={values.last_name} onChange={e=>field('last_name',e.target.value)} /></label>
      <label>Class *<select required value={values.class_name} disabled={loadingClasses||classes.length===0} onChange={e=>{field('class_name',e.target.value);setSectionChoice('')}}><option value="">{loadingClasses?'Loading classes...':classes.length?'Select a class':'No active classes found'}</option>{classes.map(item=><option key={item.id} value={item.class_name}>{item.class_name}</option>)}</select></label>
      <label>Section *<select required value={sectionChoice} disabled={!values.class_name} onChange={e=>setSectionChoice(e.target.value)}><option value="">{values.class_name?'Select a section':'Select a class first'}</option>{sections.map(section=><option key={section} value={section}>{section}</option>)}</select></label>
      <label>Gender<select value={values.gender} onChange={e=>field('gender',e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
      <label>Date of birth<input type="date" value={values.dob} onChange={e=>field('dob',e.target.value)} /></label>
      <label>Mobile<input type="tel" inputMode="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Optional. If entered, use 10 digits starting with 6, 7, 8, or 9." value={values.mobile} onChange={e=>field('mobile',phoneValue(e.target.value))} /></label>
      <label>Email<input type="email" value={values.email} onChange={e=>field('email',e.target.value)} /></label>
      {values.mobile&&!phoneOk(values.mobile)&&<div className="form-error">Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.</div>}
      {values.email&&!emailOk(values.email)&&<div className="form-error">Enter a valid email address.</div>}
      {classes.length===0&&!loadingClasses&&!classError&&<p className="field-help wide">Create an active class first under Teaching and learning → Classes.</p>}
      {classError&&<div className="form-error wide">Could not load classes: {classError}</div>}
      <label>Father name<input value={values.father_name} onChange={e=>field('father_name',e.target.value)} /></label>
      <label>Mother name<input value={values.mother_name} onChange={e=>field('mother_name',e.target.value)} /></label>
      <label>Photo<input type="file" accept="image/*" onChange={e=>field('photo',e.target.files[0])} /></label>
      <label className="wide">Address<textarea value={values.address} onChange={e=>field('address',e.target.value)} rows="2" /></label>
    </div>
    {error&&<div className="form-error">{error}</div>}
    <button className="button button-small" disabled={busy||loadingClasses||classes.length===0||!values.class_name||!selectedSection||Boolean(values.mobile&&!phoneOk(values.mobile))}><Save size={16}/>{busy?'Registering...':'Register student'}</button>
  </form>
}

function Attendance({ initialData, setError, setNotice }) {
  const [data, setData] = useState(initialData)
  const [date, setDate] = useState(today)
  const [className, setClassName] = useState('All')
  const [section, setSection] = useState('All')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const summary = data?.summary || {}
  const rows = data?.data || []
  const activeFilterCount = Number(date !== today) + Number(className !== 'All') + Number(section !== 'All')

  async function filter(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try { setData(await schoolApi.attendance(date, className, section)); setDirty(false) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  function changeStatus(id, status) {
    setData(current => ({ ...current, data: (current?.data || []).map(row => row.student_id === id ? { ...row, status } : row) }))
    setDirty(true)
  }

  async function clearFilters() {
    if (dirty && !await confirmPopup({ title: 'Discard unsaved attendance changes?', message: 'Clearing these filters reloads the default attendance list. Unsaved present or absent marks will be lost.', confirmLabel: 'Discard and clear', tone: 'danger' })) return
    setDate(today); setClassName('All'); setSection('All'); setDirty(false); setBusy(true); setError('')
    try { setData(await schoolApi.attendance(today, 'All', 'All')) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  useFilterReset(clearFilters, activeFilterCount)

  async function save() {
    setBusy(true); setError('')
    try {
      const result = await schoolApi.markAttendance({ attendance_date: date, class_name: className === 'All' ? (rows[0]?.class_name || 'All') : className, section: section === 'All' ? (rows[0]?.section || 'All') : section, students: rows.map(row => ({ student_id: row.student_id, student_name: row.student_name, status: row.status || 'Present', remarks: row.remarks || '' })) })
      setNotice(result.message || 'Attendance saved successfully.')
      setData(await schoolApi.attendance(date, className, section))
      setDirty(false)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <>
    <form className="attendance-filter" onSubmit={filter}>
      <label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label>
      <label>Class<input value={className} onChange={event => setClassName(event.target.value)} placeholder="All" /></label>
      <label>Section<input value={section} onChange={event => setSection(event.target.value)} placeholder="All" /></label>
      <button className="button button-small" disabled={busy}>{busy ? 'Loading...' : 'Load students'}</button>
    </form>
    <div className="stat-grid compact">{[['Students', summary.total_students ?? rows.length], ['Present', rows.filter(row => row.status === 'Present').length], ['Absent', rows.filter(row => row.status === 'Absent').length], ['Pending', rows.filter(row => !row.status).length]].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>{date}</span></article>)}</div>
    <section className="data-panel"><div className="panel-title"><div><span>Daily register</span><h2>Mark attendance</h2></div>{rows.length > 0 && <button className="button button-small" onClick={save} disabled={busy}><Save size={16} />{busy ? 'Saving...' : 'Save attendance'}</button>}</div>{rows.length === 0 ? <div className="empty-state"><CalendarCheck /><h3>No students found</h3><p>Choose a class and section, then load students.</p></div> : <div className="attendance-list">{rows.map(row => <div className="attendance-row" key={row.student_id}><div><b>{row.student_name}</b><small>{row.admission_no} - {row.class_name} {row.section}</small></div><div className="status-options"><button className={row.status === 'Present' ? 'present active' : 'present'} onClick={() => changeStatus(row.student_id, 'Present')}>Present</button><button className={row.status === 'Absent' ? 'absent active' : 'absent'} onClick={() => changeStatus(row.student_id, 'Absent')}>Absent</button></div></div>)}</div>}</section>
  </>
}

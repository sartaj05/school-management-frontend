import { ArrowRight, BarChart3, BellRing, BookOpen, CalendarCheck, CheckCircle2, Clock, Mail, Phone, Quote, ShieldCheck, Sparkles, UserCheck, UsersRound, Video, WalletCards, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import Logo from '../components/Logo'
import { api, schoolLogoUrl } from '../lib/api'

const features = [
  { Icon: UsersRound, title: 'Student & staff records', text: 'Keep every profile organized, searchable and available to the right people.', details: 'Create a reliable school directory with student, teacher, parent and staff profiles in one protected workspace.', plans: { Standard: 'Core records and directory access.', Premium: 'Core records plus richer school operations.', Enterprise: 'Core records with enterprise-wide controls.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['Students', 'Teachers', 'Parents'] },
  { Icon: CalendarCheck, title: 'Effortless attendance', text: 'Mark daily attendance quickly and see clear summaries at a glance.', details: 'Record attendance from a simple daily register and give authorized users the summaries they need.', plans: { Standard: 'Daily student attendance register.', Premium: 'Attendance plus advanced school operations.', Enterprise: 'Attendance with complete operational reporting.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['Daily register', 'Attendance reports', 'Class summaries'] },
  { Icon: BarChart3, title: 'One clear dashboard', text: 'Understand your school through simple, meaningful live information.', details: 'Bring the most important school totals, shortcuts and activity signals into one role-aware dashboard.', plans: { Standard: 'Core dashboard and school totals.', Premium: 'Dashboard plus Premium modules.', Enterprise: 'Dashboard plus all Enterprise modules.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['School overview', 'Quick actions', 'Role-based access'] },
  { Icon: BellRing, title: 'Connected communication', text: 'Keep families informed with class updates, meetings and reminders.', details: 'Keep staff, parents and students aligned with notifications, meetings and useful reminders.', plans: { Standard: 'Notifications and family communication.', Premium: 'Communication plus Premium workflows.', Enterprise: 'Communication with full organization controls.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['Notifications', 'Meetings', 'Reminders'] },
  { Icon: BookOpen, title: 'Academic organization', text: 'Bring classes, sections and daily academic work into one calm workspace.', details: 'Organize classes, subjects, timetables, assignments and academic records without scattered spreadsheets.', plans: { Standard: 'Classes, subjects and academic basics.', Premium: 'Academics plus richer operational tools.', Enterprise: 'Academics with organization-wide support.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['Classes', 'Subjects', 'Timetable'] },
  { Icon: ShieldCheck, title: 'Secure by role', text: 'Give admins, teachers, students and parents only the access they need.', details: 'Use role-based access so every person sees the workflows and records appropriate to their responsibility.', plans: { Standard: 'Role-based access for core modules.', Premium: 'Role access across Premium modules.', Enterprise: 'Role access with complete controls.' }, included: ['Standard', 'Premium', 'Enterprise'], related: ['School Admin', 'Teacher', 'Parent and Student'] },
  { Icon: WalletCards, title: 'Leave policy & payroll integration', text: 'Connect annual leave rules, school holidays, attendance and payroll calculations.', details: 'Premium schools can configure working-day rules, holiday calendars, approved-leave attendance linkage, and policy-controlled absence deductions during payroll generation.', plans: { Standard: 'Not included in Standard.', Premium: 'Leave policies, holiday calendars and payroll-aware attendance.', Enterprise: 'Everything in Premium with enterprise payroll operations.' }, included: ['Premium', 'Enterprise'], related: ['Leave policy', 'Holiday calendar', 'Payroll deductions'] },
  { Icon: Video, title: 'Smart classroom recording', text: 'Capture lessons and screen demonstrations in a private school library.', details: 'Enterprise schools can create class sessions, record from the browser, upload secure recordings, and preview or remove lesson media from the staff workspace.', plans: { Standard: 'Not included in Standard.', Premium: 'Not included in Premium.', Enterprise: 'Private class sessions and secure recording storage.' }, included: ['Enterprise'], related: ['Class sessions', 'Private playback', 'Recording history'] },
]

const plans = [
  { name: 'Standard', version: 'Core', description: 'Essential school management for everyday work.' },
  { name: 'Premium', version: 'Growth', description: 'Standard plus hostel, inventory, scholarships, payroll and leave policy integration.' },
  { name: 'Enterprise', version: 'Complete', description: 'Premium plus expenses, vendor payments and smart classroom recording.' },
]

const premiumFeatures = ['Hostel management', 'Inventory and assets', 'Scholarship and concessions', 'Salary setup and monthly payslips', 'Leave policy and payroll integration']
const enterpriseFeatures = ['Everything in Premium', 'Expense management', 'Vendor payments and purchasing controls', 'Smart classroom recording']
const planHighlights = { Standard: ['Student, teacher and parent records', 'Attendance, academics and communication', 'Role-based school dashboard'], Premium: ['Everything in Standard', 'Leave policy and payroll integration', 'Hostel, inventory and scholarships'], Enterprise: ['Everything in Premium', 'Expense and vendor payment controls', 'Smart classroom recording'] }

export default function LandingPage() {
  const [content, setContent] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api('/public/content')
        setContent(result.data || null)
      } catch {
        setContent(null)
      }
    }
    load()
  }, [])

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const heroImage = content?.landing_image_path ? `${apiBase}/school/uploads/${encodeURIComponent(content.landing_image_path)}` : ''
  const brandLogo = content?.brand_logo_path ? schoolLogoUrl(content.brand_logo_path) : ''
  const title = content?.landing_title || 'Where school life flows beautifully.'
  const subtitle = content?.landing_subtitle || 'Bring students, teachers, attendance and communication together in one friendly space—built to help your school focus on learning.'

  const previewBars = [64, 83, 76, 87, 84]
  const chartLabels = ['M', 'T', 'W', 'T', 'F']
  const attendanceValue = 79
  const reminderText = 'Class update'
  const connectedLearners = 1505
  const liveAttendance = 83
  const brandName = content?.school_name || 'EduFlow School Management'
  const platformRows = [
    { label: 'User logins', value: 4, note: 'Sample accounts', icon: UsersRound },
    { label: 'Student register', value: 0, note: 'Sample students', icon: UserCheck },
    { label: 'Schools live', value: 2, note: 'Sample campuses', icon: BookOpen },
  ]
  const summaryRows = [
    { label: 'Attendance', value: `${attendanceValue}%`, tone: 'mint', icon: CalendarCheck },
    { label: 'Classes', value: '24', tone: 'sky', icon: BookOpen },
    { label: 'Alerts', value: '08', tone: 'amber', icon: BellRing },
  ]
  const weekRows = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => ({
    day,
    attendance: `${previewBars[index]}%`,
    classes: 4 + (index % 3),
    alerts: index === 2 ? 'Fee follow-up' : index === 4 ? 'Weekly report' : 'Routine updates',
  }))

  useEffect(() => {
    if (!selectedFeature) return undefined
    const closeOnEscape = event => event.key === 'Escape' && setSelectedFeature(null)
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [selectedFeature])

  return <PublicLayout>
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> A simpler day for every school</div>
          <h1>{title.split(' ').slice(0, 3).join(' ')}<br /><span>{title.split(' ').slice(3).join(' ') || 'flows beautifully.'}</span></h1>
          <p>{subtitle}</p>
          <div className="hero-actions"><Link className="button" to="/login">Explore your dashboard <ArrowRight size={18} /></Link><Link className="text-link" to="/admissions/apply">Apply for admission</Link></div>
          <div className="trust-row"><span><CheckCircle2 /> Easy to use</span><span><CheckCircle2 /> Secure access</span><span><CheckCircle2 /> Works everywhere</span></div>
        </div>
        <div className="hero-visual" aria-label="Static school dashboard product preview">
          <div className="float-card float-one"><span className="mini-icon mint"><CalendarCheck /></span><div><b>{attendanceValue}%</b><small>Attendance today</small></div></div>
          <div className="dashboard-preview hero-asset-card">
            <div className="brand-strip">
              <span>{brandLogo ? <img src={brandLogo} alt={`${brandName} logo`} /> : <Logo />}</span>
              <small>Product preview · Sample data</small>
            </div>
            {heroImage && <img className="landing-school-image" src={heroImage} alt={`${brandName} school`} />}
            <div className="dynamic-preview-shell">
              <div className="landing-summary-table">
                <div className="landing-summary-head"><span>Metric</span><span>Total</span><span>Status</span></div>
                {platformRows.map(({ label, value, note, icon: Icon }) => (
                  <div className="landing-summary-row" key={label}>
                    <span><Icon size={16} />{label}</span>
                    <strong>{Number(value).toLocaleString()}</strong>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
              <div className="summary-table-panel">
                {summaryRows.map(({ label, value, tone, icon: Icon }) => (
                  <div key={label} className={`summary-row ${tone}`}>
                    <span className="summary-icon"><Icon /></span>
                    <div className="summary-meta">
                      <strong>{value}</strong>
                      <small>{label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dynamic-chart-card">
                <div className="chart-header">
                  <span>Current week</span>
                  <div className="chart-toggle" />
                </div>
                <div className="week-table" aria-label="Current week overview">
                  {weekRows.map((row, index) => (
                    <div className="week-row" key={row.day}>
                      <b>{chartLabels[index]}</b>
                      <span>{row.attendance}</span>
                      <div className="day-popover">
                        <strong>{row.day}</strong>
                        <small>{row.classes} classes</small>
                        <small>{row.alerts}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="float-card float-two"><span className="mini-icon coral"><BellRing /></span><div><b>{reminderText}</b><small>Reminder sent</small></div></div>
        </div>
      </section>

      <section id="features" className="section container"><div className="section-heading"><span>Everything in one place</span><h2>Less administration.<br />More education.</h2><p>Click any feature to see what each plan includes.</p></div><div className="feature-grid">{features.map(feature => { const { Icon, title, text } = feature; return <button className="feature-card feature-card-button" type="button" key={title} onClick={() => setSelectedFeature(feature)} aria-label={`View plan details for ${title}`}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{text}</p><span className="feature-card-link">View plan details <ArrowRight size={15} /></span></button> })}</div></section>

      <section id="plans" className="section container plan-section"><div className="section-heading"><span>Plans that grow with you</span><h2>Choose the right operating level.</h2><p>Every plan starts with a calm school workspace. Premium adds policy-aware staff operations, while Enterprise adds private classroom recording.</p></div><div className="plan-showcase">{plans.map(plan => <article className={`plan-showcase-card plan-${plan.name.toLowerCase()}`} key={plan.name}><span className="plan-badge">{plan.version} plan</span><h3>{plan.name}</h3><p>{plan.description}</p><ul>{planHighlights[plan.name].map(item => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul><Link className="text-link" to="/login">Explore {plan.name} <ArrowRight size={15} /></Link></article>)}</div></section>

      <section id="about" className="story-section"><div className="container story-grid"><div className="story-art" aria-label="A connected digital school campus">{heroImage ? <img className="story-school-photo" src={heroImage} alt={`${brandName} campus`} /> : <><div className="campus-glow"/><div className="campus-cloud cloud-one"/><div className="campus-cloud cloud-two"/><div className="campus-sun"><Sparkles/></div><div className="campus-card campus-card-top"><UsersRound/><span><b>{connectedLearners.toLocaleString()}</b><small>Connected learners</small></span></div><div className="campus-card campus-card-bottom"><CalendarCheck/><span><b>{Math.round(liveAttendance)}% today</b><small>Live attendance</small></span></div><div className="school-building"><div className="building-flag"/><div className="building-roof"/><div className="building-body"><div className="building-title"><Logo/><small>Learning campus</small></div><div className="building-windows"><span/><span/><span/><span/></div><div className="building-door"/></div><div className="campus-tree tree-one"><i/><span/></div><div className="campus-tree tree-two"><i/><span/></div><div className="campus-path"/><div className="ground"/></div></>}</div><div className="story-copy"><span className="section-kicker">Designed around people</span><h2>Technology that feels human.</h2><p>EduFlow is designed to quietly support your team-not get in its way. Clear screens, useful information and fewer repetitive tasks mean more time for what matters.</p><blockquote><Quote/><p>For the first time, our team can see what is happening across the school without chasing spreadsheets.</p><footer>- School Administrator</footer></blockquote></div></div></section>

      <section className="cta-section container"><div><span>Ready for a calmer school day?</span><h2>Bring your whole school together.</h2><p>Sign in to connect with your existing school management API.</p></div><Link className="button button-white" to="/login">Open dashboard <ArrowRight size={18} /></Link></section>
    </main>
    <footer id="contact" className="footer container">
      {brandLogo ? <span className="footer-logo-img"><img src={brandLogo} alt={`${brandName} logo`} /></span> : <Logo />}
      <p>Helping schools do their best work.</p>
      <div className="footer-contact">
        <span><Mail size={14} />{content?.contact_email || 'hello@eduflow.com'}</span>
        <span><Phone size={14} />{content?.contact_phone || '+91 98765 43210'}</span>
        <span><Clock size={14} />{content?.support_note || 'Technical support during school hours.'}</span>
      </div>
      <small>© {new Date().getFullYear()} {brandName}</small>
    </footer>
    {selectedFeature && <div className="feature-modal" role="presentation" onMouseDown={() => setSelectedFeature(null)}><div className="feature-modal-card" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title" onMouseDown={event => event.stopPropagation()}><button className="feature-modal-close" type="button" onClick={() => setSelectedFeature(null)} aria-label="Close feature details"><X size={19} /></button><div className="feature-modal-heading"><span className="feature-icon"><selectedFeature.Icon /></span><div><span>Feature and plan details</span><h2 id="feature-modal-title">{selectedFeature.title}</h2><p>{selectedFeature.details}</p></div></div><div className="feature-plan-grid">{plans.map(plan => <article className={`feature-plan-card plan-${plan.name.toLowerCase()}`} key={plan.name}><div><strong>{plan.name}</strong><small>{plan.version} plan</small></div>{selectedFeature.included.includes(plan.name) ? <CheckCircle2 className="plan-included" size={20} /> : <X className="plan-locked" size={20} />}<p>{selectedFeature.plans[plan.name]}</p><span>{plan.description}</span></article>)}</div><div className="feature-modal-section"><span>Related tools</span><div className="feature-related-list">{selectedFeature.related.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</div></div><div className="feature-tier-summary"><article><strong>Premium includes</strong>{premiumFeatures.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</article><article><strong>Enterprise includes</strong>{enterpriseFeatures.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</article></div><Link className="button feature-modal-action" to="/login" onClick={() => setSelectedFeature(null)}>Open dashboard <ArrowRight size={16} /></Link></div></div>}
  </PublicLayout>
}

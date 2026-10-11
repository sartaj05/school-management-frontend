import { ArrowRight, BarChart3, BellRing, BookOpen, CalendarCheck, CheckCircle2, Clock, Mail, Phone, ShieldCheck, Sparkles, UserCheck, UsersRound, Video, WalletCards, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import Logo from '../components/Logo'
import { schoolApi, schoolLogoUrl } from '../lib/api'
import { translateText } from '../lib/i18n'

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

const defaultPlans = [
  { key: 'standard', name: 'Standard', version: 'Core', description: 'Essential school management for everyday work.', highlights: ['Student, teacher and parent records', 'Attendance, academics and communication', 'Role-based school dashboard'] },
  { key: 'premium', name: 'Premium', version: 'Growth', description: 'Standard plus hostel, inventory, scholarships, payroll and leave policy integration.', highlights: ['Everything in Standard', 'Leave policy and payroll integration', 'Hostel, inventory and scholarships'] },
  { key: 'enterprise', name: 'Enterprise', version: 'Complete', description: 'Premium plus expenses, vendor payments and smart classroom recording.', highlights: ['Everything in Premium', 'Expense and vendor payment controls', 'Smart classroom recording'] },
]

const premiumFeatures = ['Hostel management', 'Inventory and assets', 'Scholarship and concessions', 'Salary setup and monthly payslips', 'Leave policy and payroll integration']
const enterpriseFeatures = ['Everything in Premium', 'Expense management', 'Vendor payments and purchasing controls', 'Smart classroom recording']
const planHighlights = { Standard: ['Student, teacher and parent records', 'Attendance, academics and communication', 'Role-based school dashboard'], Premium: ['Everything in Standard', 'Leave policy and payroll integration', 'Hostel, inventory and scholarships'], Enterprise: ['Everything in Premium', 'Expense and vendor payment controls', 'Smart classroom recording'] }
const standardPlanFeatures = ['Teacher workspace navigation', 'Homework and assignments', 'Exams, marks and report cards', 'School calendar and events', 'Library management', 'Attendance reports', 'Parent-teacher meetings', 'Document center and exports', 'Admissions CRM and enrollment', 'Fee invoices, receipts and payments', 'Finance matching and daily closing', 'Transport status and route updates', 'School notifications and alerts', 'Parent and student portal', 'Reports and PDF/XLSX exports', 'Language and accessibility controls']
const premiumPlanFeatures = ['Hostel management', 'Leave policy and payroll', 'Scholarships and concessions', 'Inventory and purchase management', 'Academic analytics']
const enterprisePlanFeatures = ['Expense and vendor payments', 'Smart classroom recording']
const planFeatureFallbacks = {
  Standard: standardPlanFeatures,
  Premium: [...standardPlanFeatures, ...premiumPlanFeatures],
  Enterprise: [...standardPlanFeatures, ...premiumPlanFeatures, ...enterprisePlanFeatures],
}

const planFeatureLabels = plan => {
  const apiFeatures = Array.isArray(plan?.features) ? plan.features.map(feature => feature?.label).filter(Boolean) : []
  const fallback = planFeatureFallbacks[plan?.name] || plan?.highlights || planHighlights[plan?.name] || []
  return [...new Set([...apiFeatures, ...fallback])]
}

const planFeatureGroups = plan => {
  const labels = planFeatureLabels(plan)
  return Array.from({ length: Math.ceil(labels.length / 5) }, (_, index) => labels.slice(index * 5, index * 5 + 5))
}

export default function LandingPage({ language = 'en' }) {
  const [content, setContent] = useState(null)
  const [planCatalog, setPlanCatalog] = useState(defaultPlans)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPlanComparison, setShowPlanComparison] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await schoolApi.publicContent()
        setContent(result.data || null)
      } catch {
        setContent(null)
      }
    }
    load()
  }, [])

  useEffect(() => {
    schoolApi.publicPlans().then(result => {
      if (Array.isArray(result.plans) && result.plans.length) setPlanCatalog(result.plans)
    }).catch(() => {})
  }, [])

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const storyImage = content?.story_image_path ? `${apiBase}/school/uploads/${encodeURIComponent(content.story_image_path)}` : ''
  const brandLogo = content?.brand_logo_path ? schoolLogoUrl(content.brand_logo_path) : ''
  const copy = key => translateText(language, key)
  const title = language === 'en' ? (content?.landing_title || copy('heroTitle')) : copy('heroTitle')
  const subtitle = language === 'en' ? (content?.landing_subtitle || copy('heroSubtitle')) : copy('heroSubtitle')

  const brandName = content?.school_name || 'EduFlow School Management'
  useEffect(() => {
    if (!selectedFeature && !selectedPlan && !showPlanComparison) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') { setSelectedFeature(null); setSelectedPlan(null); setShowPlanComparison(false) } }
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [selectedFeature, selectedPlan, showPlanComparison])

  return <PublicLayout language={language}>
    <main className="landing-refresh">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> EduFlow by WSI Gloabal</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="hero-actions"><Link className="button" to="/login">{copy('exploreDashboard')} <ArrowRight size={18} /></Link><a className="text-link" href="#plans">Find your plan <ArrowRight size={16}/></a></div>
          <div className="trust-row"><span><CheckCircle2 /> Role-based access</span><span><CheckCircle2 /> Desktop and mobile</span></div>
        </div>
        <figure className="product-workspace-preview">
          <div className="product-preview-heading"><span>YOUR SCHOOL, CONNECTED</span><b>One place for the school day</b></div>
          <LiveSchoolSummary summary={content?.summary} />
          <figcaption>Live school summary <span>Updated from your school records</span></figcaption>
        </figure>
      </section>

      <section className="role-introduction container" aria-label="Connected school roles"><span>Built for your whole school</span><p>School administrators <i>/</i> Teachers <i>/</i> Students <i>/</i> Parents</p></section>

      <section id="features" className="section container"><div className="section-heading"><span>Everything in one place</span><h2>Less administration.<br />More education.</h2><p>Explore the tools that support your school’s daily work.</p></div><div className="feature-grid">{features.map(feature => { const { Icon, title, text } = feature; return <button className="feature-card feature-card-button" type="button" key={title} onClick={() => setSelectedFeature(feature)} aria-label={`View plan details for ${title}`}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{text}</p><span className="feature-card-link">View plan details <ArrowRight size={15} /></span></button> })}</div></section>

      <section id="plans" className="section container plan-section"><div className="section-heading"><span>Plans that grow with you</span><h2>Choose the right operating level.</h2><p>Start with everyday school management. Add staff operations in Premium, or choose Enterprise for the complete feature set.</p></div><div className="plan-showcase">{planCatalog.map(plan => <article className={`plan-showcase-card plan-${plan.name.toLowerCase()}`} key={plan.key || plan.name}><span className="plan-badge">{plan.version} plan</span><h3>{plan.name}</h3><p>{plan.description}</p><ul>{(plan.highlights || planHighlights[plan.name] || []).map(item => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul><button className="text-link plan-explore" type="button" onClick={() => { setShowPlanComparison(false); setSelectedPlan(plan) }}>Explore {plan.name} <ArrowRight size={15} /></button></article>)}</div><div className="plan-section-actions"><p className="trial-plan-note"><b>Trial access</b> Explore the same core modules as Standard. Contact us to arrange your school workspace.</p><button className="button button-ghost plan-compare-button" type="button" onClick={() => { setSelectedPlan(null); setShowPlanComparison(true) }}><Sparkles size={16} />Compare plans <ArrowRight size={16} /></button></div></section>

      <section id="about" className="connected-school-section container">
        <div className="connected-school-photo"><img src={storyImage || '/images/family-workspace-preview.png'} alt={storyImage ? `${brandName} campus` : 'EduFlow family portal with the selected child’s school information'} loading="lazy" /></div>
        <div className="connected-school-copy"><span className="section-kicker">A connected school day</span><h2>Every role has a clear next step.</h2><p>School records become useful when the right people can act on them.</p><ol><li><b>Admin prepares the school</b><span>Connect people, classes and access.</span></li><li><b>Teachers manage daily learning</b><span>Record attendance, publish work and share feedback.</span></li><li><b>Families stay informed</b><span>Review the timetable, results, fees and messages.</span></li></ol><Link to="/admissions/apply" className="text-link">Apply for admission <ArrowRight size={16}/></Link></div>
      </section>

      <section className="cta-section container"><div><span>EduFlow by WSI Gloabal</span><h2>Your next school day, organized.</h2><p>Talk to us about the right plan for your school.</p></div><Link className="button button-white" to="/contact">Contact our team <ArrowRight size={18} /></Link></section>
    </main>
    <footer id="contact" className="footer container">
      {brandLogo ? <span className="footer-logo-img"><img src={brandLogo} alt={`${brandName} logo`} /></span> : <Logo />}
      <p>School management by WSI Gloabal.</p>
      <div className="footer-contact">
        <span><Mail size={14} />{content?.contact_email || content?.support_email || 'hello@eduflow.com'}</span>
        <span><Phone size={14} />{content?.contact_phone || content?.support_phone || '+91 98765 43210'}</span>
        <span><Clock size={14} />{content?.support_note || 'Technical support during school hours.'}</span>
      </div>
      <small>© {new Date().getFullYear()} {brandName}</small>
    </footer>
    {selectedFeature && <div className="feature-modal" role="presentation" onMouseDown={() => setSelectedFeature(null)}><div className="feature-modal-card" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title" onMouseDown={event => event.stopPropagation()}><button className="feature-modal-close" type="button" onClick={() => setSelectedFeature(null)} aria-label="Close feature details"><X size={19} /></button><div className="feature-modal-heading"><span className="feature-icon"><selectedFeature.Icon /></span><div><span>Feature and plan details</span><h2 id="feature-modal-title">{selectedFeature.title}</h2><p>{selectedFeature.details}</p></div></div><div className="feature-plan-grid">{planCatalog.map(plan => <article className={`feature-plan-card plan-${plan.name.toLowerCase()}`} key={plan.key || plan.name}><div><strong>{plan.name}</strong><small>{plan.version} plan</small></div>{selectedFeature.included.includes(plan.name) ? <CheckCircle2 className="plan-included" size={20} /> : <X className="plan-locked" size={20} />}<p>{selectedFeature.plans[plan.name]}</p><span>{plan.description}</span></article>)}</div><div className="feature-modal-section"><span>Related tools</span><div className="feature-related-list">{selectedFeature.related.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</div></div><div className="feature-tier-summary"><article><strong>Premium includes</strong>{premiumFeatures.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</article><article><strong>Enterprise includes</strong>{enterpriseFeatures.map(item => <span key={item}><CheckCircle2 size={14} />{item}</span>)}</article></div><Link className="button feature-modal-action" to="/login" onClick={() => setSelectedFeature(null)}>Open dashboard <ArrowRight size={16} /></Link></div></div>}
    {selectedPlan && <div className="feature-modal" role="presentation" onMouseDown={() => setSelectedPlan(null)}><div className="feature-modal-card plan-details-modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" onMouseDown={event => event.stopPropagation()}><button className="feature-modal-close" type="button" onClick={() => setSelectedPlan(null)} aria-label="Close plan details" title="Close plan details"><X size={19} /></button><div className="feature-modal-heading"><span className="feature-icon"><Sparkles /></span><div><span>Plan details</span><h2 id="plan-modal-title">{selectedPlan.name}</h2><p>{selectedPlan.description}</p></div></div><div className="feature-plan-grid plan-feature-box-grid">{planFeatureGroups(selectedPlan).map((items, index) => <article className={`feature-plan-card plan-${selectedPlan.name.toLowerCase()}`} key={`${selectedPlan.key || selectedPlan.name}-feature-group-${index}`}><div><strong>{selectedPlan.name}</strong><small>{selectedPlan.version} plan · Features {index * 5 + 1}-{index * 5 + items.length}</small></div><CheckCircle2 className="plan-included" size={20} /><p>Included features</p><div className="plan-feature-list">{items.map(item => <span key={item}><CheckCircle2 size={14} /> {item}</span>)}</div></article>)}</div><Link className="button feature-modal-action" to="/login" onClick={() => setSelectedPlan(null)}>Get started with {selectedPlan.name} <ArrowRight size={16} /></Link></div></div>}
    {showPlanComparison && <div className="feature-modal" role="presentation" onMouseDown={() => setShowPlanComparison(false)}><div className="feature-modal-card plan-details-modal" role="dialog" aria-modal="true" aria-labelledby="compare-plans-title" onMouseDown={event => event.stopPropagation()}><button className="feature-modal-close" type="button" onClick={() => setShowPlanComparison(false)} aria-label="Close plan comparison" title="Close plan comparison"><X size={19} /></button><div className="feature-modal-heading"><span className="feature-icon"><Sparkles /></span><div><span>Plan comparison</span><h2 id="compare-plans-title">Compare all plans</h2><p>Review every included feature by plan, side by side.</p></div></div><div className="feature-plan-grid">{planCatalog.map(plan => <article className={`feature-plan-card plan-${plan.name.toLowerCase()}`} key={plan.key || plan.name}><div><strong>{plan.name}</strong><small>{plan.version} plan</small></div><CheckCircle2 className="plan-included" size={20} /><p>All included features</p><div className="plan-feature-list">{planFeatureLabels(plan).map(item => <span key={item}><CheckCircle2 size={14} /> {item}</span>)}</div></article>)}</div></div></div>}
  </PublicLayout>
}

function LiveSchoolSummary({ summary }) {
  const count = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '—'
  const percent = value => Number.isFinite(Number(value)) ? `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}%` : '—'
  const totals = [
    ['User logins', summary?.user_logins, 'Active user accounts', UsersRound],
    ['Student register', summary?.student_registrations, 'Registered students', UserCheck],
    ['Schools live', summary?.schools, 'Active campuses', BookOpen],
  ]
  return <div className="school-live-summary" aria-label="Live school dashboard summary">
    <div className="live-summary-brand"><Logo/><span>Live summary</span></div>
    <div className="live-summary-totals">{totals.map(([label,value,note,Icon])=><div key={label}><span><Icon size={17}/>{label}</span><strong>{count(value)}</strong><small>{note}</small></div>)}</div>
    <div className="live-summary-daily"><div><CalendarCheck size={20}/><strong>{percent(summary?.attendance_today)}</strong><span>Attendance today</span></div><div><BookOpen size={20}/><strong>{count(summary?.classes)}</strong><span>Classes</span></div><div><BellRing size={20}/><strong>{count(summary?.alerts_today)}</strong><span>Alerts today</span></div></div>
    <div className="live-summary-week"><b>Current week</b><div>{['Monday','Tuesday','Wednesday','Thursday','Friday'].map((day,i)=>{const row=summary?.week?.[i];return <div key={day} title={row ? `${row.day || day}: ${count(row.classes)} classes, ${count(row.alerts)} alerts` : 'Awaiting school summary'}><span>{(row?.day||day).slice(0,3)}</span><strong>{percent(row?.attendance)}</strong></div>})}</div></div>
  </div>
}

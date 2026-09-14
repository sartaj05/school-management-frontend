import { ArrowRight, BarChart3, BellRing, BookOpen, CalendarCheck, CheckCircle2, Clock, Mail, Phone, Quote, ShieldCheck, Sparkles, UserCheck, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import Logo from '../components/Logo'
import { api, schoolLogoUrl } from '../lib/api'

const features = [
  [UsersRound, 'Student & staff records', 'Keep every profile organized, searchable and available to the right people.'],
  [CalendarCheck, 'Effortless attendance', 'Mark daily attendance quickly and see clear summaries at a glance.'],
  [BarChart3, 'One clear dashboard', 'Understand your school through simple, meaningful live information.'],
  [BellRing, 'Connected communication', 'Keep families informed with class updates, meetings and reminders.'],
  [BookOpen, 'Academic organization', 'Bring classes, sections and daily academic work into one calm workspace.'],
  [ShieldCheck, 'Secure by role', 'Give admins, teachers, students and parents only the access they need.'],
]

export default function LandingPage() {
  const [content, setContent] = useState(null)

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

  const today = new Date()
  const dynamicBars = Array.from({ length: 5 }, (_, index) => {
    const base = [66, 82, 72, 92, 86][index] ?? 75
    const drift = ((today.getDate() + index * 3) % 12) - 5
    return Math.max(40, Math.min(96, base + drift))
  })
  const chartLabels = ['M', 'T', 'W', 'T', 'F']
  const attendanceValue = Math.round(dynamicBars.reduce((sum, value) => sum + value, 0) / dynamicBars.length)
  const reminderText = ['Parent meeting', 'Fee reminder', 'Class update', 'Staff sync'][today.getDay() % 4]
  const connectedLearners = 980 + (((today.getDate() * 17) + (today.getMonth() * 13) + today.getFullYear()) % 620)
  const liveAttendance = Math.min(99, Math.max(76, 84 + ((today.getDate() + today.getMonth()) % 10) - 4))
  const brandName = content?.school_name || 'EduFlow School Management'
  const summary = content?.summary || {}
  const platformRows = [
    { label: 'User logins', value: summary.user_logins ?? 0, note: 'Total accounts created', icon: UsersRound },
    { label: 'Student register', value: summary.student_registrations ?? 0, note: 'Students admitted', icon: UserCheck },
    { label: 'Schools live', value: summary.schools ?? 0, note: 'Active campuses', icon: BookOpen },
  ]
  const summaryRows = [
    { label: 'Attendance', value: `${attendanceValue}%`, tone: 'mint', icon: CalendarCheck },
    { label: 'Fees', value: '₹12.4k', tone: 'purple', icon: BarChart3 },
    { label: 'Classes', value: '24', tone: 'sky', icon: BookOpen },
    { label: 'Alerts', value: '08', tone: 'amber', icon: BellRing },
  ]
  const weekRows = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => ({
    day,
    attendance: `${dynamicBars[index]}%`,
    classes: 4 + (index % 3),
    alerts: index === 2 ? 'Fee follow-up' : index === 4 ? 'Weekly report' : 'Routine updates',
  }))

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
        <div className="hero-visual" aria-label="School dashboard preview">
          <div className="float-card float-one"><span className="mini-icon mint"><CalendarCheck /></span><div><b>{attendanceValue}%</b><small>Attendance today</small></div></div>
          <div className="dashboard-preview hero-asset-card">
            <div className="brand-strip">
              <span>{brandLogo ? <img src={brandLogo} alt={`${brandName} logo`} /> : <Logo />}</span>
              <small>Public school portal</small>
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

      <section id="features" className="section container"><div className="section-heading"><span>Everything in one place</span><h2>Less administration.<br />More education.</h2><p>Thoughtful tools for the everyday work that keeps a school moving.</p></div><div className="feature-grid">{features.map(([Icon,title,text]) => <article className="feature-card" key={title}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

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
  </PublicLayout>
}

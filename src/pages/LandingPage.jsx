import { ArrowRight, BarChart3, BellRing, BookOpen, CalendarCheck, CheckCircle2, Quote, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import Logo from '../components/Logo'

const features = [
  [UsersRound, 'Student & staff records', 'Keep every profile organized, searchable and available to the right people.'],
  [CalendarCheck, 'Effortless attendance', 'Mark daily attendance quickly and see clear summaries at a glance.'],
  [BarChart3, 'One clear dashboard', 'Understand your school through simple, meaningful live information.'],
  [BellRing, 'Connected communication', 'Keep families informed with class updates, meetings and reminders.'],
  [BookOpen, 'Academic organization', 'Bring classes, sections and daily academic work into one calm workspace.'],
  [ShieldCheck, 'Secure by role', 'Give admins, teachers, students and parents only the access they need.'],
]

export default function LandingPage() {
  return <PublicLayout>
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> A simpler day for every school</div>
          <h1>Where school life<br /><span>flows beautifully.</span></h1>
          <p>Bring students, teachers, attendance and communication together in one friendly space—built to help your school focus on learning.</p>
          <div className="hero-actions"><Link className="button" to="/login">Explore your dashboard <ArrowRight size={18} /></Link><Link className="text-link" to="/admissions/apply">Apply for admission</Link></div>
          <div className="trust-row"><span><CheckCircle2 /> Easy to use</span><span><CheckCircle2 /> Secure access</span><span><CheckCircle2 /> Works everywhere</span></div>
        </div>
        <div className="hero-visual" aria-label="School dashboard preview">
          <div className="float-card float-one"><span className="mini-icon mint"><CalendarCheck /></span><div><b>94%</b><small>Attendance today</small></div></div>
          <div className="dashboard-preview">
            <div className="preview-top"><Logo /><span className="avatar">AM</span></div>
            <div className="preview-welcome"><small>Good morning, Principal</small><h3>Here’s your school today.</h3></div>
            <div className="preview-stats"><div><small>Students</small><b>1,248</b><i>+24 this month</i></div><div><small>Teachers</small><b>86</b><i>All departments</i></div></div>
            <div className="chart-card"><div><b>Weekly attendance</b><small>Mon — Fri</small></div><div className="bars">{[66,82,72,92,86].map((h, i) => <span key={i} style={{height:`${h}%`}} />)}</div><div className="bar-labels"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span></div></div>
          </div>
          <div className="float-card float-two"><span className="mini-icon coral"><BellRing /></span><div><b>Parent meeting</b><small>Reminder sent</small></div></div>
        </div>
      </section>

      <section id="features" className="section container"><div className="section-heading"><span>Everything in one place</span><h2>Less administration.<br />More education.</h2><p>Thoughtful tools for the everyday work that keeps a school moving.</p></div><div className="feature-grid">{features.map(([Icon,title,text]) => <article className="feature-card" key={title}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section id="about" className="story-section"><div className="container story-grid"><div className="story-art" aria-label="A connected digital school campus"><div className="campus-glow"/><div className="campus-cloud cloud-one"/><div className="campus-cloud cloud-two"/><div className="campus-sun"><Sparkles/></div><div className="campus-card campus-card-top"><UsersRound/><span><b>1,248</b><small>Connected learners</small></span></div><div className="campus-card campus-card-bottom"><CalendarCheck/><span><b>94% today</b><small>Live attendance</small></span></div><div className="school-building"><div className="building-flag"/><div className="building-roof"/><div className="building-body"><div className="building-title"><Logo/><small>Learning campus</small></div><div className="building-windows"><span/><span/><span/><span/></div><div className="building-door"/></div><div className="campus-tree tree-one"><i/><span/></div><div className="campus-tree tree-two"><i/><span/></div><div className="campus-path"/><div className="ground"/></div></div><div className="story-copy"><span className="section-kicker">Designed around people</span><h2>Technology that feels human.</h2><p>EduFlow is designed to quietly support your team—not get in its way. Clear screens, useful information and fewer repetitive tasks mean more time for what matters.</p><blockquote><Quote/><p>“For the first time, our team can see what is happening across the school without chasing spreadsheets.”</p><footer>— School Administrator</footer></blockquote></div></div></section>

      <section className="cta-section container"><div><span>Ready for a calmer school day?</span><h2>Bring your whole school together.</h2><p>Sign in to connect with your existing school management API.</p></div><Link className="button button-white" to="/login">Open dashboard <ArrowRight size={18} /></Link></section>
    </main>
    <footer id="contact" className="footer container"><Logo /><p>Helping schools do their best work.</p><small>© 2026 EduFlow School Management</small></footer>
  </PublicLayout>
}

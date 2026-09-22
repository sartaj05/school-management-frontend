import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { translateText } from '../lib/i18n'

export default function PublicLayout({ children, language = (typeof document !== 'undefined' ? document.documentElement.dataset.language || 'en' : 'en') }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }, [location])

  return <div className="site-shell">
    <header className="public-header container">
      <Link to="/" aria-label="EduFlow home"><Logo /></Link>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'nav-open' : ''}>
        <Link to="/#features">{translateText(language, 'features')}</Link>
        <Link to="/#plans">{translateText(language, 'plans')}</Link>
        <Link to="/#about">{translateText(language, 'about')}</Link>
        <Link to="/contact">{translateText(language, 'contact')}</Link>
        <Link className="button button-small button-ghost" to="/login">{translateText(language, 'signIn')}</Link>
        <Link className="button button-small" to="/login">{translateText(language, 'getStarted')}</Link>
      </nav>
    </header>
    {children}
  </div>
}

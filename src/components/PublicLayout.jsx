import { ArrowRight, LogIn, Menu, X } from 'lucide-react'
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
    <header className="public-header">
      <div className="public-header-inner container">
        <Link className="public-brand" to="/" aria-label="EduFlow home"><Logo /></Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-navigation" aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
        <nav id="public-navigation" className={open ? 'nav-open' : ''} aria-label="Main navigation">
          <div className="public-nav-links">
            <Link className="public-nav-link" to="/#features">{translateText(language, 'features')}</Link>
            <Link className="public-nav-link" to="/#plans">{translateText(language, 'plans')}</Link>
            <Link className="public-nav-link" to="/#about">{translateText(language, 'about')}</Link>
            <Link className="public-nav-link" to="/contact">{translateText(language, 'contact')}</Link>
          </div>
          <div className="public-header-actions">
            <Link className="button button-small button-ghost public-sign-in" to="/login"><LogIn size={16} />{translateText(language, 'signIn')}</Link>
            <Link className="button button-small public-get-started" to="/login">{translateText(language, 'getStarted')}<ArrowRight size={16} /></Link>
          </div>
        </nav>
      </div>
    </header>
    {children}
  </div>
}

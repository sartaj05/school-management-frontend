import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'

export default function PublicLayout({ children }) {
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
        <Link to="/#features">Features</Link>
        <Link to="/#about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link className="button button-small button-ghost" to="/login">Sign in</Link>
        <Link className="button button-small" to="/login">Get started</Link>
      </nav>
    </header>
    {children}
  </div>
}

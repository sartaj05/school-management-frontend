import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false)
  return <div className="site-shell">
    <header className="public-header container">
      <Link to="/" aria-label="EduFlow home"><Logo /></Link>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'nav-open' : ''}>
        <a href="/#features">Features</a><a href="/#about">About</a><a href="/#contact">Contact</a>
        <Link className="button button-small button-ghost" to="/login">Sign in</Link>
        <Link className="button button-small" to="/login">Get started</Link>
      </nav>
    </header>
    {children}
  </div>
}

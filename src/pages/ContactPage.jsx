import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone, Clock, Headphones } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { api } from '../lib/api'

export default function ContactPage({ language = 'en' }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api('/public/content')
        setContent(result.data || null)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  return (
    <PublicLayout language={language}>
      <main className="contact-page container">
        <section className="contact-hero">
          <span className="section-kicker">Contact us</span>
          <h1>We’re here to help your school grow.</h1>
          <p>{content?.contact_message || 'We would love to hear from you and help your school grow.'}</p>
        </section>

        <section className="contact-grid">
          <article className="data-panel contact-card">
            <div className="panel-title">
              <div><span>Get in touch</span><h2>Contact details</h2></div>
            </div>
            <ul className="contact-list">
              <li><Mail size={18} /><div><small>Email</small><b>{content?.contact_email || 'hello@eduflow.com'}</b></div></li>
              <li><Phone size={18} /><div><small>Phone</small><b>{content?.contact_phone || '+91 98765 43210'}</b></div></li>
              <li><MapPin size={18} /><div><small>Address</small><b>{content?.contact_address || 'Main Campus Road, School District, India'}</b></div></li>
              <li><Clock size={18} /><div><small>Hours</small><b>{content?.contact_hours || 'Mon - Sat, 9:00 AM - 6:00 PM'}</b></div></li>
              <li><Headphones size={18} /><div><small>Technical support</small><b>{content?.support_email || content?.contact_email || 'support@eduflow.com'}</b><b>{content?.support_phone || content?.contact_phone || '+91 98765 43210'}</b></div></li>
            </ul>
          </article>

          <article className="data-panel contact-card highlight-card">
            <div className="panel-title">
              <div><span>Questions?</span><h2>Send us a note</h2></div>
            </div>
            <p>Tell us about your school and the support you need. Our team will get back to you quickly.</p>
            <a className="button" href={`mailto:${content?.contact_email || 'hello@eduflow.com'}`}>Email now</a>
          </article>
        </section>

        {error && <div className="form-error">{error}</div>}
      </main>
    </PublicLayout>
  )
}

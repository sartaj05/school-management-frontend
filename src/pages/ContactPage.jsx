import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone, Clock, Headphones } from 'lucide-react'
import PublicLayout from '../components/PublicLayout'
import { api } from '../lib/api'
import { translateUi } from '../lib/i18n'

export default function ContactPage({ language = 'en' }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const t = value => translateUi(language, value)

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
          <span className="section-kicker">{t('Contact us')}</span>
          <h1>{t("We're here to help your school grow.")}</h1>
          <p>{content?.contact_message || t('We would love to hear from you and help your school grow.')}</p>
        </section>

        <section className="contact-grid">
          <article className="data-panel contact-card">
            <div className="panel-title">
              <div><span>{t('Get in touch')}</span><h2>{t('Contact details')}</h2></div>
            </div>
            <ul className="contact-list">
              <li><Mail size={18} /><div><small>{t('Email')}</small><b>{content?.contact_email || 'hello@eduflow.com'}</b></div></li>
              <li><Phone size={18} /><div><small>{t('Phone')}</small><b>{content?.contact_phone || '+91 98765 43210'}</b></div></li>
              <li><MapPin size={18} /><div><small>{t('Address')}</small><b>{content?.contact_address || 'Main Campus Road, School District, India'}</b></div></li>
              <li><Clock size={18} /><div><small>{t('Hours')}</small><b>{content?.contact_hours || 'Mon - Sat, 9:00 AM - 6:00 PM'}</b></div></li>
              <li><Headphones size={18} /><div><small>{t('Technical support')}</small><b>{content?.support_email || content?.contact_email || 'support@eduflow.com'}</b><b>{content?.support_phone || content?.contact_phone || '+91 98765 43210'}</b></div></li>
            </ul>
          </article>

          <article className="data-panel contact-card highlight-card">
            <div className="panel-title">
              <div><span>{t('Questions?')}</span><h2>{t('Send us a note')}</h2></div>
            </div>
            <p>{t('Tell us about your school and the support you need. Our team will get back to you quickly.')}</p>
            <a className="button" href={`mailto:${content?.contact_email || 'hello@eduflow.com'}`}>{t('Email now')}</a>
          </article>
        </section>

        {error && <div className="form-error">{error}</div>}
      </main>
    </PublicLayout>
  )
}

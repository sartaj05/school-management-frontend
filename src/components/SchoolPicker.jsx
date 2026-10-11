import { School } from 'lucide-react'
import { useId, useState } from 'react'
import { schoolLogoUrl } from '../lib/api'

function SchoolIcon({ school }) {
  const [failed, setFailed] = useState(false)
  return <span className="school-picker-icon">{school?.logoPath && !failed ? <img src={schoolLogoUrl(school.logoPath)} alt="" onError={() => setFailed(true)} /> : <School aria-hidden="true" />}</span>
}

export default function SchoolPicker({ form, schools, setForm }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const selected = schools.find(school => school.domain === form.school_domain)
  const value = selected ? selected.schoolName : form.school_domain
  const matches = schools.filter(school => selected || `${school.schoolName} ${school.domain}`.toLowerCase().includes(value.toLowerCase())).slice(0, 30)
  function pick(school) { setForm(current => ({ ...current, school_domain: school.domain })); setOpen(false) }
  return <div className="school-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <label htmlFor={id}>Select School Name</label>
    <div className="input-wrap"><SchoolIcon key={selected?.domain || 'none'} school={selected} />
      <input id={id} name="school_domain" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-options`} aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
        value={value} required autoComplete="off" placeholder="Search school name" onFocus={() => setOpen(true)}
        onChange={event => { const input = event.target.value; setForm(current => ({ ...current, school_domain: input })); setActive(0); setOpen(true) }}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))) }
          if (event.key === 'Enter' && open && matches[active]) { event.preventDefault(); pick(matches[active]) }
        }} />
    </div>
    {open && <div id={`${id}-options`} role="listbox" aria-label="Schools" className="school-picker-options">
      {matches.map((school, index) => <button type="button" role="option" aria-selected={active === index} id={`${id}-${index}`} key={school.id} onMouseDown={event => event.preventDefault()} onClick={() => pick(school)}>
        <SchoolIcon school={school} /><span><strong>{school.schoolName}</strong><small>{school.domain}</small></span>
      </button>)}
      {!matches.length && <p>No matching school. Check the name or enter your school domain.</p>}
    </div>}
  </div>
}

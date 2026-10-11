export default function EnrollmentLimitFields({ values, onChange }) {
  const rows = values.classLimitRows || Object.entries(values.class_student_limits || {}).map(([name, limit]) => ({ name, limit }))
  function updateRows(next) { onChange({ ...values, classLimitRows: next }) }
  return <fieldset className="enrollment-limit-fields wide"><legend>Student enrollment limits</legend>
    <p>Superadmin sets these limits for this school. Only active students count. Class limits include all sections.</p>
    <div className="field-grid">
      <label>Maximum students in school<input type="number" min="1" max="2147483647" step="1" value={values.max_students ?? ''} onChange={e => onChange({ ...values, max_students: e.target.value })} placeholder="No limit configured" /></label>
      <label>Default maximum students per class<input type="number" min="1" max="2147483647" step="1" value={values.default_class_max_students ?? ''} onChange={e => onChange({ ...values, default_class_max_students: e.target.value })} placeholder="No limit configured" /></label>
    </div>
    {rows.map((row, index) => <div className="class-limit-row" key={index}>
      <label>Class name<input required value={row.name} placeholder="Grade 5" onChange={e => updateRows(rows.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /></label>
      <label>Maximum students<input required type="number" min="1" max="2147483647" step="1" value={row.limit} onChange={e => updateRows(rows.map((item, i) => i === index ? { ...item, limit: e.target.value } : item))} /></label>
      <button type="button" className="text-action" onClick={() => updateRows(rows.filter((_, i) => i !== index))}>Remove class limit</button>
    </div>)}
    <button type="button" className="text-action" onClick={() => updateRows([...rows, { name: '', limit: '' }])}>Add class-specific limit</button>
    <small className="field-help">An individual class limit overrides the default. Leave a school or default limit blank for no configured cap. When a limit is reached, enrollment stops and asks for a plan upgrade through Superadmin.</small>
  </fieldset>
}

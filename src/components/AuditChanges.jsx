const display = value => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)
export default function AuditChanges({details}) {
  const changes=Array.isArray(details?.changes)?details.changes:[]
  return changes.length?<details><summary>View {changes.length} field changes</summary><div className="table-wrap"><table><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>{changes.map(c=><tr key={c.field}><td>{c.field.replaceAll('_',' ')}</td><td style={{overflowWrap:'anywhere'}}>{display(c.before)}</td><td style={{overflowWrap:'anywhere'}}>{display(c.after)}</td></tr>)}</tbody></table></div></details>:<small>No field-level snapshot recorded for this event.</small>
}

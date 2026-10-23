import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

export default function SubscriptionHistory({ schoolId }) {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    schoolApi.subscriptionHistory(schoolId, page).then(data => {
      if (active) { setResult(data); setError('') }
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [schoolId, page, retry])
  const changePage = value => { setResult(null); setError(''); setPage(value) }
  return <section aria-label="Subscription history">
    <h3>Subscription history</h3><p>Dates use UTC. Actor numbers identify platform administrators.</p>
    {error ? <p role="alert">{error} <button type="button" onClick={() => setRetry(v => v + 1)}>Retry history</button></p> : !result ? <p>Loading history…</p> : <>
      {!result.items.length && <p>No subscription changes recorded.</p>}
      {result.items.map(row => <article className="editor-card" key={row.id}>
        <p><strong>{row.changed_at} UTC</strong> · Actor: {row.changed_by ?? 'System'}</p>
        <p>{row.reason || 'No reason recorded'}</p>
        <p>Plan: {row.old_plan ?? 'None'} → {row.new_plan} · Status: {row.old_status ?? 'None'} → {row.new_status}</p>
        {row.snapshot_complete ? <>
          <p>Trial expiry: {row.old_trial_ends_at ?? 'No expiry'} → {row.new_trial_ends_at ?? 'No expiry'}</p>
          <p>Plan expiry: {row.old_plan_ends_at ?? 'No expiry'} → {row.new_plan_ends_at ?? 'No expiry'}</p>
        </> : <p>Expiry snapshots were not recorded for this older entry.</p>}
      </article>)}
      <p>Page {page} · {result.total} changes</p>
      <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous history</button>{' '}
      <button type="button" disabled={page * result.per_page >= result.total} onClick={() => changePage(page + 1)}>Next history</button>
    </>}
  </section>
}

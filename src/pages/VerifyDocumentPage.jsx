import OpenInApp from '../components/OpenInApp'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function VerifyDocumentPage() {
  const { token } = useParams(), [result, setResult] = useState(null), [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/documents/verify/${encodeURIComponent(token)}`, { signal: controller.signal }).then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.message || 'Unable to verify document.'); setResult(body.data) }).catch(e => { if (e.name !== 'AbortError') setError(e.message) })
    return () => controller.abort()
  }, [token])
  return <main style={{ maxWidth: 760, margin: '40px auto', padding: 24 }}><section className="data-panel"><h1>School document verification</h1>{error ? <p role="alert">{error}</p> : !result ? <p role="status">Checking document…</p> : <><h2>{result.status === 'valid' ? 'Valid issued document' : result.status === 'replaced' ? 'Replaced — use the latest document' : 'Revoked — no longer valid'}</h2><dl><dt>School</dt><dd>{result.school_name}</dd><dt>Document</dt><dd>{result.title}</dd><dt>Student (masked)</dt><dd>{result.student_name}</dd><dt>Issued</dt><dd>{new Date(result.issued_at).toLocaleString()}</dd><dt>Verification ID</dt><dd style={{ overflowWrap: 'anywhere' }}>{token}</dd><dt>Original PDF SHA-256</dt><dd style={{ overflowWrap: 'anywhere' }}>{result.sha256}</dd></dl><p>This confirms the issuance record. Compare the original PDF hash to detect altered files. Marks and personal records are private.</p></>}<OpenInApp destination="document" id={token}/><a href="/">Return to EduFlow</a></section></main>
}

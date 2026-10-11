import { Building2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

export default function BranchScopeNotice() {
  const [scope, setScope] = useState(null)

  useEffect(() => {
    let active = true
    schoolApi.branchScope()
      .then(result => { if (active && result?.branch_mapped) setScope(result) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!scope?.branch) return null
  const allowed = scope.allowed !== false
  const branch = scope.branch
  return <section className={'branch-scope-notice ' + (allowed ? 'allowed' : 'restricted')} role={allowed ? 'status' : 'alert'}>
    <span className="branch-scope-icon">{allowed ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}</span>
    <div>
      <b><Building2 size={15} />{branch.branch_name} · {branch.branch_code}</b>
      <span>{allowed ? (scope.enforced ? 'Your account is assigned to this school branch.' : 'This school branch is identified from your tenant session.') : 'Your account is not assigned to this branch. Contact the School Admin.'}</span>
    </div>
  </section>
}

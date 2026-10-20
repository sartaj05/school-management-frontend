import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import { allowNavigation, hasUnsavedGuard } from '../lib/unsavedChanges'

export default function UnsavedNavigationGuard() {
  const blocker = useBlocker(() => hasUnsavedGuard())
  const pending = useRef(false)
  useEffect(() => {
    if (blocker.state !== 'blocked' || pending.current) return
    pending.current = true
    allowNavigation().then(allowed => allowed ? blocker.proceed() : blocker.reset())
      .finally(() => { pending.current = false })
  }, [blocker])
  return null
}

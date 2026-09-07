import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { subscribeConfirmation } from '../lib/confirmPopup'

export function ConfirmationDialogHost() {
  const [dialog, setDialog] = useState(null)
  const cancelRef = useRef(null)

  useEffect(() => {
    const open = config => setDialog(config)
    return subscribeConfirmation(open)
  }, [])

  useEffect(() => {
    if (!dialog) return undefined
    cancelRef.current?.focus()
    const closeOnEscape = event => {
      if (event.key === 'Escape') finish(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('dialog-open')
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('dialog-open')
    }
  }, [dialog]) // eslint-disable-line react-hooks/exhaustive-deps

  function finish(answer) {
    const current = dialog
    setDialog(null)
    current?.resolve(answer)
  }

  if (!dialog) return null
  return <div className="confirm-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) finish(false) }}>
    <section className={`confirm-dialog ${dialog.tone}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <button className="confirm-close" aria-label="Close confirmation" onClick={() => finish(false)}><X /></button>
      <span className="confirm-icon"><AlertTriangle /></span>
      <div className="confirm-copy"><small>Action confirmation</small><h2 id="confirm-title">{dialog.title}</h2><p id="confirm-message">{dialog.message}</p></div>
      <div className="confirm-actions"><button ref={cancelRef} className="confirm-cancel" onClick={() => finish(false)}>{dialog.cancelLabel}</button><button className="confirm-primary" onClick={() => finish(true)}>{dialog.confirmLabel}</button></div>
    </section>
  </div>
}

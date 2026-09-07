const listeners = new Set()

export function subscribeConfirmation(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function confirmPopup(options) {
  const config = typeof options === 'string' ? { message: options } : options
  return new Promise(resolve => {
    const listener = [...listeners][0]
    if (!listener) return resolve(false)
    listener({
      title: 'Please confirm',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      tone: 'danger',
      ...config,
      resolve,
    })
  })
}


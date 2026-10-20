let guard = null
export function registerUnsavedGuard(callback) {
  guard = callback
  return () => { if (guard === callback) guard = null }
}
export function hasUnsavedGuard() { return guard !== null }
export async function allowNavigation() { return guard ? guard() : true }

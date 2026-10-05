import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const FilterResetContext = createContext(null)

export function FilterResetProvider({ children }) {
  const [active, setActive] = useState({ token: null, count: 0, clear: null })
  const activeRef = useRef(active)
  activeRef.current = active

  const register = useCallback((clear, count) => {
    const token = {}
    setActive({ token, count, clear })
    return () => setActive(current => current.token === token ? { token: null, count: 0, clear: null } : current)
  }, [])

  const clearCurrent = useCallback(() => activeRef.current.clear?.(), [])
  const value = { register, count: active.count, clearCurrent }
  return <FilterResetContext.Provider value={value}>{children}</FilterResetContext.Provider>
}

export function useFilterReset(onClear, activeCount) {
  const context = useContext(FilterResetContext)
  const clearRef = useRef(onClear)
  clearRef.current = onClear

  useEffect(() => {
    if (!context) return undefined
    return context.register(() => clearRef.current(), activeCount)
  }, [context?.register, activeCount])
}

export function useCurrentFilterReset() {
  return useContext(FilterResetContext) || { count: 0, clearCurrent: () => {} }
}

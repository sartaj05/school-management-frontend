/* This small context intentionally exports its provider and consumer hooks together. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'

const FilterResetContext = createContext(null)

export function FilterResetProvider({ children }) {
  const [active, setActive] = useState({ token: null, count: 0, clear: null })

  const register = useCallback((clear, count) => {
    const token = {}
    setActive({ token, count, clear })
    return () => setActive(current => current.token === token ? { token: null, count: 0, clear: null } : current)
  }, [])

  const clear = active.clear
  const clearCurrent = useCallback(() => clear?.(), [clear])
  const value = { register, count: active.count, clearCurrent }
  return <FilterResetContext.Provider value={value}>{children}</FilterResetContext.Provider>
}

export function useFilterReset(onClear, activeCount) {
  const context = useContext(FilterResetContext)
  const clearRef = useRef(onClear)
  useLayoutEffect(() => { clearRef.current = onClear }, [onClear])
  const register = context?.register

  useEffect(() => {
    if (!register) return undefined
    return register(() => clearRef.current(), activeCount)
  }, [register, activeCount])
}

export function useCurrentFilterReset() {
  return useContext(FilterResetContext) || { count: 0, clearCurrent: () => {} }
}

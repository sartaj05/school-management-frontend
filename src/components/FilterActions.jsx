import { RotateCcw, SlidersHorizontal } from 'lucide-react'

export default function FilterActions({ onClear, activeCount = 0, busy = false, showApply = false, applyLabel = 'Apply filters' }) {
  return <div className="filter-actions">
    {showApply && <button className="button button-small" type="submit" disabled={busy}>
      <SlidersHorizontal size={15} />{applyLabel}{activeCount > 0 && <span className="filter-count">{activeCount}</span>}
    </button>}
    <button className="button button-small button-ghost" type="button" onClick={onClear} disabled={busy || activeCount === 0}>
      <RotateCcw size={15} />Clear filters{activeCount > 0 && <span className="filter-count muted">{activeCount}</span>}
    </button>
  </div>
}

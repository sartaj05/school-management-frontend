export function reportTimestamp(value) {
  if (!value) return '—'
  // Older API responses omitted the UTC offset. New responses include it.
  const text = String(value)
  const instant = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`)
  return Number.isNaN(instant.getTime()) ? '—' : instant.toLocaleString()
}

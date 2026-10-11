export function enrollmentLimitPayload(values) {
  const rows = values.classLimitRows || Object.entries(values.class_student_limits || {}).map(([name, limit]) => ({ name, limit }))
  const limits = {}
  for (const row of rows) {
    const name = row.name.trim().toLowerCase()
    if (!name || Object.hasOwn(limits, name)) throw new Error('Each class limit needs a unique class name.')
    limits[name] = row.limit
  }
  return { max_students: values.max_students ?? '', default_class_max_students: values.default_class_max_students ?? '', class_student_limits: JSON.stringify(limits) }
}

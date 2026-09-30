import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('scheduled reports expose native format selection and run history', () => {
  const api = source('src/lib/api.js')
  const screen = source('src/components/ScheduledReports.jsx')
  assert.match(api, /scheduledReportRuns/)
  for (const contract of ['export_format', 'PDF', 'XLSX', 'viewRuns', 'Run history']) {
    assert.match(screen, new RegExp(contract))
  }
})

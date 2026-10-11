# React release QA

The repository CI runs lint, unit/contract tests and a production build. Before
sharing a client demo, complete these browser checks with a keyboard and a
screen reader on the deployed URL.

## Role and tenant checks

- Sign in as Super Admin and confirm only platform schools, users, maintenance
  and public website pages are visible.
- Sign in as School Admin, Teacher, Accounts Staff, Parent and Student. Confirm
  each role cannot open another role's URL by typing it directly.
- Use two fake schools and confirm search, dashboard, reports, fees and portal
  records never cross the school boundary.
- Verify logout clears the session and refresh-token storage, then verify the
  browser back button cannot reopen the dashboard.

## Accessibility checks

- Open the language panel with the keyboard and select every supported language.
- Tab through login, dialogs, filters and export actions without a focus trap.
- Confirm dialogs expose a name, close button and Escape handling.
- Confirm error and success messages use live-region semantics.
- Test at 200% browser zoom and with reduced motion/high contrast enabled.

## Data and export checks

- Run the fake demo seed, record attendance, create a fee receipt, close the
  finance day and export PDF/XLSX.
- Confirm loading, empty and API-error states are visible instead of silently
  showing placeholder values.
- Do not use real student, parent or payment data in the demo environment.

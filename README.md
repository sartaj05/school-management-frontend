# EduFlow React School Management Website

React/Vite frontend for the multi-tenant EduFlow School Management System. It
connects to the Flask backend API and provides the role-aware school dashboard
for administrators, accounts staff, teachers and portal users.

## Included features

- School administration, student/teacher/parent directories and academics
- Attendance, exams, assignments, fees, library and notifications
- Parent/student portal, calendar, messaging and admissions
- Payroll, leave, inventory, transport and reporting
- Finance ledger, bank/payment reference matching and daily settlement closing
- Native PDF/XLSX report downloads and print-ready reports

## Run locally

Start the Flask backend first, then run from this directory:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to
`http://127.0.0.1:5000`. For another API server, copy `.env.example` to
`.env.local` and set `VITE_API_BASE_URL` to a URL ending in `/api/v1`.

## Verify changes

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

## Repository layout

- `src/components/` — feature screens and dashboard components
- `src/lib/api.js` — authenticated backend API client
- `src/pages/DashboardPage.jsx` — role-aware dashboard routing
- `tests/` — frontend unit tests
- `docs/README.md` — detailed frontend documentation index

Backend database setup, API contracts and server-side documentation are kept in
the separate Flask repository.

# EduFlow React Website

React/Vite client for the multi-tenant Flask School Management API. Updated
14 September 2026 through Inventory and Asset Management (feature 49).

## Run and build

Start Flask from the root with `python -m flask --app src:create_app run --debug --port 5000`.
From this directory run `npm.cmd ci`, then `npm.cmd run dev`, and visit
`http://localhost:5173`. Use `npm.cmd run build` and `npm.cmd run lint` for checks.

Vite proxies `/api` to `http://127.0.0.1:5000`. For another API, copy `.env.example`
to `.env.local` and set `VITE_API_BASE_URL` to the full URL ending in `/api/v1`.

## Connected screens

- Public landing/contact and admissions; school/super-admin login.
- School administration, directories, relationships, academics and timetables.
- Attendance/reports, exams, fees, assignments, library and notifications/queue.
- Linked parent/student portal, calendar, admission review and document exports.
- Staff attendance/payroll, vehicles/routes/stops/assignments and latest bus locations.
- Inventory & Assets for School Admin: categories/rooms/items, receipts/write-offs, staff/room asset custody, returns, maintenance, low-stock alerts and stock history.
- Leave Management for School Admin, Teacher and Student: requests, balances,
  allowance adjustments, decisions, cancellation and audit history.

Leave admins select a person before configuring allowances or submitting on their
behalf. Teachers/students use their linked profiles. Pending days are reserved;
weekends count; cross-year requests must be split. Only admins cancel approved
leave. Parents currently use the existing portal and do not have leave access.

API methods live in `src/lib/api.js`; menu routing is in
`src/pages/DashboardPage.jsx`; leave controls are in `src/components/LeaveManagement.jsx`.
The Payroll menu now renders the existing PayrollManagement component.

Backend database setup, API contracts, payloads and limitations are maintained
in the Flask API repository.

Inventory uses `src/components/InventoryManagement.jsx`. Apply the tenant
upgrade in the Flask API before use.

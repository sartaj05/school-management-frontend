# EduFlow React Website — Documentation

This folder contains the React website documentation index. The root
[`README.md`](../README.md) is the GitHub landing page for this repository.

## Project

The website is a React/Vite client for the EduFlow Flask School Management API.
It uses the shared API client in `src/lib/api.js` and renders the role-aware
school administration dashboard from `src/pages/DashboardPage.jsx`.

## Main screens

- School and user administration, student/teacher/parent directories
- Academics, attendance, exams, assignments, fees and library
- Linked parent/student portal, calendar, notifications and messaging
- Payroll, leave, inventory, transport and reports
- Finance ledger, bank/payment reference matching and daily closing
- Native PDF/XLSX report download controls

## Development

From this directory:

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

The Vite development server proxies `/api` to `http://127.0.0.1:5000`. To use
another backend, copy `.env.example` to `.env.local` and set
`VITE_API_BASE_URL` to a URL ending in `/api/v1`.

## Related documentation

- [Website README](../README.md)
- [API client](../src/lib/api.js)
- [Dashboard routing](../src/pages/DashboardPage.jsx)
- [Backend documentation index](../../Flak-API---For-School-Management-System-app/docs/README.md)

The backend repository owns database setup, API contracts and server-side
feature documentation. This repository contains only the React client.

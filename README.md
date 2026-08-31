# EduFlow React Website

Responsive React website for the Flask School Management API.

## Run locally

1. Start Flask from the repository root: `python app.py`
2. Open this folder: `cd school-management-website`
3. Install packages: `npm install`
4. Start React: `npm run dev`
5. Visit `http://localhost:5173`

Vite proxies `/api` to `http://127.0.0.1:5000`. For a deployed API, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the full API URL ending in `/api/v1`.

## Connected modules

- school and super-admin login
- dashboard summary
- school listing (super admin)
- students, classes and users
- daily attendance summary and records

The API client is in `src/lib/api.js`. Add future endpoint functions there, then expose them in a page.

# React browser E2E

The release smoke suite covers school login, the student CRUD form, fee and
notification screen loading, and the browser's offline error boundary.

Run it against a running Vite frontend and backend demo tenant:

```powershell
$env:WEB_E2E_BASE_URL = 'http://127.0.0.1:5173'
$env:E2E_SCHOOL_DOMAIN = 'eduflow_demo_school'
$env:E2E_ADMIN_EMAIL = 'demo.admin@eduflow.test'
$env:E2E_ADMIN_PASSWORD = 'DemoOnly@12345'
npm install
npx playwright install chromium
npm run test:e2e
```

The suite is intentionally skipped when credentials are not supplied, so a
normal unit-test run never contacts a tenant. The React web client currently
does not implement an offline mutation queue; its offline test therefore
expects a visible error boundary rather than pretending that a write synced.

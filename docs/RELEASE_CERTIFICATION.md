# EduFlow release certification

Run this gate before a client demo or production deployment, from the selected release commit:

```powershell
.\.venv\Scripts\python.exe scripts\release_readiness.py --strict --json
python -m unittest tests.test_release_certification
cd ..\school-management-frontend
npm test
cd ..\Multi-Tenant-School-Management-System-app-
flutter test test/release_certification_test.dart
```

The strict backend gate requires an isolated `TEST_DATABASE_URL`; it must not
equal `DATABASE_URL`. The integration database is never reset by the release
gate.

Required release evidence:

- Super Admin and all seven tenant roles pass the current login/navigation and
  API authorization checks for their enabled workflows;
- the two-school tenant-isolation E2E passes against the dedicated PostgreSQL
  integration database and rejects foreign-school reads and mutations;
- React keyboard/focus and localization contracts pass;
- Flutter widget and API contract tests pass on the target device profiles;
- initial JavaScript remains below 900 KB compressed-equivalent build budget;
- API p95 for the demo workflow remains below 800 ms under the agreed load;
- no critical accessibility or security findings remain open.

These are release thresholds, not a claim that a local machine has already
met them. Record the actual test output in the deployment ticket.

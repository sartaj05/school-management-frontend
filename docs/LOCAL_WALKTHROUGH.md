# Local browser verification — 10 October 2026

The frontend and Flask API were run against the existing local PostgreSQL database. All writes below used synthetic `eduflow_demo_*` schools and accounts. Four schools and School Admin accounts were created for Trial, Standard, Premium and Enterprise, with the downloaded dummy school logo. Account details and startup instructions are in the backend's `docs/LOCAL_PORTAL_TESTING.md`; passwords are in its ignored `LOCAL_TEST_CREDENTIALS.txt`.

## Sidebar coverage

The visible Chrome walkthrough followed Superadmin → Admin → Teacher → Student → Parent. Every page listed below loaded without a visible API error or an uncaught page exception in the successful runs. Responsive checks repeated each page at **1440, 1024, 768, 390 and 320 pixels**, checking document overflow, heading fit and screenshots. Wide data tables retain horizontal scrolling inside their table containers.

| Role | Pages | Checked modules |
|---|---:|---|
| Superadmin | 6 | Overview, Schools, Branches, Users, Website Content, Maintenance |
| Admin | 41 | Overview, School Onboarding, People, Users, Teachers, Staff HR, Students, Parents, Portal Access, Academics, Academic Years, Exams & Results, Smart Classroom, Assignments, Documents, Calendar, Meetings, Messages, Classes, Subjects, Teacher Assignments, Timetable, Library, Hostel, Admissions, Inventory & Assets, Transport, Leave Management, Attendance, Attendance Reports, Notifications, Payroll, Scholarships, Expenses, Finance Ledger, Fees, Reports & Exports, Scheduled Reports, Academic Analytics, Audit Logs, Settings |
| Teacher | 23 | Overview, Academics, Academic Years, Academic Analytics, Calendar, Meetings, Messages, Reports & Exports, Smart Classroom, Documents, Exams & Results, Assignments, Library, Timetable, Subjects, Students, Classes, Attendance, Attendance Reports, Notifications, Settings, Leave Management, Fee Collection |
| Student | 8 | Overview, My Portal, Calendar, Messages, Documents, Notifications, Leave Management, Settings |
| Parent | 8 | Overview, My Portal, Calendar, Meetings, Messages, Documents, Notifications, Settings |

This is 86 role/page combinations and 430 responsive page checks. Navigation coverage does not imply that every button or every possible input was exercised. The concrete workflow coverage is below.

## Actions performed

- **Superadmin:** four plan schools and administrators; logo upload; school view/edit; school and user deactivate/reactivate with final active state; user search/plan/role filters and clear; unchanged user edit; branch creation, grouping, mapping, activation state and consolidated summary; website-content save; maintenance status, confirmation guard and backed-up tenant schema upgrade.
- **Admin:** all available search/refresh controls; six CSV onboarding templates and class CSV preview/import; HR tab navigation and staff document creation; exam creation, marks loading and report cards; Smart Classroom session creation; future-month calendar event creation; assignment draft/publish/submission register; class creation; library book creation/issue/return; inventory category/item creation and stock receipt; transport vehicle and route creation; scholarship program creation; expense vendor/category/draft bill creation; CSV for every report catalog entry plus XLSX/PDF exports; attendance CSV; profile save.
- **Teacher:** all sidebar pages; available search/refresh controls; assignment draft/publish/submission register; attendance CSV; profile save.
- **Student:** all sidebar pages and all eleven My Portal tabs; synthetic homework submission with persisted submitted status; profile save.
- **Parent:** all sidebar pages and all eleven My Portal tabs; linked student data; profile save.

The backend demo flow also exercised admissions, attendance, fee receipt, finance close, notifications, transport, portal profile isolation and native exports. Its integration suite ran against the separate `codex_school_portal_test_20261010` database: **148 passed, one opt-in live test skipped**. That live test separately passed **27 parallel Smart Classroom/Transport requests**. React's **39 unit/contract tests**, lint and production build passed.

## Fixes found during this walkthrough

- Superadmin user filters passed React events instead of selected values, breaking search/filter interactions.
- Saving an unchanged linked user email was incorrectly rejected as a duplicate in the backend.
- Inactive branches disappeared from a selected group's management directory, preventing reactivation.
- School updates reset the directory's filter state by reloading and unmounting the parent page.
- The Documents effect returned a Promise, causing a React unmount error.
- Library issue controls read the wrong student response field and showed an empty picker.
- Parent/Student Documents and Notifications opened staff-only screens and returned permission errors.
- The Calendar showed only the current month, hiding successfully created future events. It now has a month selector and follows the month of a newly saved event.
- Concurrent Smart Classroom and Transport compatibility DDL could deadlock. Tenant-scoped advisory locks serialize those updates.
- Leave approval lost its teacher/student fields after locking the request row; approval now retains them.
- Responsive headers crowded long titles and controls. The header now wraps into explicit rows at tablet/phone sizes.
- Test trace HTML could trigger Vite reloads during form entry; generated artifacts are excluded from the watcher.

## Evidence and reruns

- `e2e/local_roles.spec.js`: plan setup, Superadmin controls, ordered role walkthrough, responsive matrix and public pages.
- `e2e/local_actions.js`: role-specific actions used by the walkthrough.
- `e2e/local_workflows.spec.js`: additional Admin workflows in sidebar order.
- Ignored `local-test-results/walkthrough/`: successful visible role runs.
- Ignored `local-test-results/responsive/`: successful Superadmin responsive screenshots (also contains an interrupted earlier tenant run).
- Ignored `local-test-results/responsive-final/`: final tenant/public responsive run.
- Ignored `local-test-results/workflows-final/`: successful additional Admin workflow run.

These opt-in tests require `LOCAL_PORTAL_E2E=1` and the local passwords in environment variables. Synthetic create workflows add test records on each run. Keep the servers running and avoid editing React source during a visible form walkthrough.

## Additional lifecycle checks

The continuation added `e2e/local_lifecycles.spec.js`, using installed Chrome at desktop (1440 × 900, visible) and phone (390 × 844) sizes. These checks exercise persisted changes and the resulting role-to-role behavior:

- Admin creates and edits a subject, assigns its teacher, creates/edits a timetable period, then archives those records.
- Admin creates a hostel building, room and bed, allocates a student, records attendance, checks a visitor in/out, and releases the bed.
- Admin records staff attendance, configures salary, generates January 2030 draft payroll and downloads the teacher payslip.
- Teacher and Student request leave; Admin approves both, checks weekday attendance linkage and weekend exclusion, reviews history, then cancels both and verifies attendance restoration.
- Teacher publishes availability; Parent books and cancels a meeting; Teacher cancels the synthetic slot and its future reminders.
- Teacher submits a synthetic cash collection; Admin approves it; Student and Parent download the paid invoice receipt. No gateway or actual money transfer is involved.

The leave screen now explains that balances charge calendar days; weekend/holiday exclusions govern attendance linkage. The backend adds an integration regression for a Friday–Monday request, including approval and cancellation. The fee approval queue now refreshes the invoice register and summary immediately after review; previously the register still displayed a pending invoice after a successful approval.

All six scenarios passed at both sizes (12 successful scenario runs across the lifecycle and fee-specific runs). Final fee evidence is in ignored `local-test-results/fee-lifecycle-final/` and `local-test-results/fee-lifecycle-phone-final/`; the five phone workflows are in `local-test-results/lifecycles-phone/`. The continuation also passed all 11 leave integration tests, all 39 React tests, lint and production build.

Run the lifecycle suite with the same environment variables described above:

```powershell
npx playwright test e2e/local_lifecycles.spec.js --headed --workers=1
$env:LOCAL_PHONE_E2E = '1'
npx playwright test e2e/local_lifecycles.spec.js --workers=1
```

These tests add synthetic records. Leave requests and meeting bookings are cancelled, and hostel beds released, at the end of successful runs. Payroll is a draft; the synthetic fee payment remains recorded for receipt testing. Interrupted runs can leave additional test records.

## Remaining environment-dependent verification

Real payment settlement/refunds, external email/WhatsApp delivery, actual GPS/background tracking, camera/screen recording and media transcoding, MFA authenticator enrollment, and Flutter real-device behavior were not certified by these browser checks. Flutter analysis reported 17 informational findings; no Flutter runtime test or Flutter code change was made. No external notification or real-money transaction was sent during these UI workflows.

The installed Chrome executable was used for the browser tests. Native desktop Chrome control later stopped because the computer-use tool could not verify the current browser URL; no further native input was attempted after that stop.

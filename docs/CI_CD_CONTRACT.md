# EduFlow website CI contract

Pull requests and pushes to `main` or `sartaj` must pass:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`

The website CI does not contain provider credentials or production API keys.
Use the deployment environment for those values and keep the test API tenant
isolated from real school data.

# Browser API smoke checks

`quality` runs lint, unit tests and the production build. `browser-api-smoke`
creates an isolated PostgreSQL database, starts the pinned Flask commit, seeds
synthetic accounts, and exercises login, student creation, finance, notifications,
offline errors, subscription history and reconciliation pagination.

The Flask repository is private. A repository administrator must configure the
Actions secret `API_REPO_READ_TOKEN` with read-only Contents access to
`SABIR02071992/Flak-API---For-School-Management-System-app`. Never commit a token.
Without that secret the smoke job fails; it is not silently skipped. Update the
pinned API SHA in `.github/workflows/ci.yml` when its contract changes.

Before merging, configure branch protection or a repository ruleset to require
both `quality` and `browser-api-smoke`. Adding workflow jobs alone does not make
them required checks. The current connected account cannot administer all three
repositories; repository owners must complete that setting.

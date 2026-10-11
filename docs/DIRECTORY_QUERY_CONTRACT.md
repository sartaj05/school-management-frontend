# Directory query contract

Student, teacher, parent and class list endpoints support server-side query
parameters:

`q` (or existing `search`), `status`, `page`, `per_page` (or `limit`).

Responses include `pagination.page`, `pagination.per_page`, `pagination.total`
and `pagination.pages`. Directory screens should use these values for paging
instead of filtering a full tenant directory in the browser.

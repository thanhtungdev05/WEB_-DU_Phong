---
name: php-postgres-api
description: Use for PHP 8.2 REST API, front-controller routing, PDO PostgreSQL queries, request validation, transactions, API response contracts, or PHP-side spreadsheet integration.
---

# PHP/PostgreSQL API workflow

1. Locate the route in the custom front controller and supporting library code.
2. Validate method, authentication, authorization, path/body/query input, and expected response shape.
3. Use prepared PDO statements for dynamic values.
4. Use transactions for multi-step writes that must be atomic.
5. Keep HTTP status codes and JSON contracts consistent with frontend callers.
6. Avoid leaking SQL errors, credentials, session data, or personal data.
7. Check concurrency/idempotency where duplicate submissions are possible.
8. Add or update the project's PHP regression coverage.
9. For PhpSpreadsheet usage, validate file size/type and avoid formula/file-content assumptions.

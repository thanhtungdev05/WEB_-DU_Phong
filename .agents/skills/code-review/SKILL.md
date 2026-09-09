---
name: code-review
description: Use to review changes for security, authorization, data loss, API contract breakage, concurrency, migration risk, deployment regressions, or missing tests.
---

# Review priorities

1. authentication/authorization bypass,
2. secret/personal-data exposure,
3. data loss or migration corruption,
4. API/frontend contract breakage,
5. dispatcher/static-file exposure,
6. transaction/concurrency issues,
7. broken Django/PHP shared-schema assumptions,
8. missing regression tests,
9. runtime/deployment regressions,
10. maintainability.

Give concrete findings with file/function context and impact.

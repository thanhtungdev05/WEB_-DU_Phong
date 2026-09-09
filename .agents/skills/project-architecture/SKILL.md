---
name: project-architecture
description: Use before substantial changes or when tracing behavior across browser, Python dispatcher, PHP API, Django Admin, PostgreSQL, authentication, or deployment.
---

# Project architecture workflow

1. Identify the user-visible entrypoint and expected behavior.
2. Trace the real request path:
   - static asset,
   - `/api/*` to PHP,
   - `/admin/*` to Django.
3. Identify database tables and shared contracts involved.
4. Identify authentication/session boundary involved.
5. Reuse existing architecture instead of moving responsibilities between PHP, Django, and dispatcher without a clear requirement.
6. Identify affected tests and deployment behavior before editing.
7. Summarize cross-layer impact after the change.

Never assume Django is the primary REST backend.

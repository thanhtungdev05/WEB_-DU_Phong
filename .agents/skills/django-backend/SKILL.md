---
name: django-backend
description: Use for Django backend work in the FPT web project: views, models, forms, serializers, services, URLs, middleware, authentication integration, ORM queries, migrations, and backend tests.
---

# Django backend workflow

1. Confirm the installed Django/project conventions from the repository.
2. Trace URL -> view/controller -> service/business logic -> ORM/model -> response.
3. Validate input server-side.
4. Enforce authentication and authorization server-side.
5. Use transactions for multi-step writes that must be atomic.
6. Avoid obvious N+1 ORM access; use select_related/prefetch_related when justified.
7. Create migrations for model/schema changes.
8. Keep secrets in environment/configuration, never source.
9. Add/update tests for success, invalid input, and permission boundaries.
10. Run the smallest relevant test set first, then broader regression tests where practical.

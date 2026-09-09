---
name: django-admin
description: Use for the Django 5.2 admin application, admin URLs/views/forms/models, native Django authentication/session behavior, or admin access to shared PostgreSQL tables.
---

# Django Admin workflow

1. Treat Django as the admin application, not the primary REST backend.
2. Confirm whether a model is `managed=False` before changing schema-related behavior.
3. Do not generate Django migrations for shared application tables managed by custom SQL migrations.
4. Preserve Django native authentication/session boundaries unless an explicit integration requirement exists.
5. Enforce staff/superuser/object authorization server-side.
6. Avoid N+1 queries in admin list/detail views where relevant.
7. Run `manage.py check` and relevant Django/Python tests after changes.

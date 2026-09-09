---
name: keycloak-iam-rbac
description: Use for FPT IAM/Keycloak OAuth2 login, authorization-code flow, identity mapping, PHP sessions, RBAC, direct endpoint protection, logout, or local authentication bypass logic.
---

# IAM / Keycloak / RBAC workflow

Verify:
1. OAuth authorization-code flow and redirect URI assumptions.
2. `state` generation, storage, comparison, and replay boundaries.
3. Trusted identity claims and account mapping.
4. Server-side role/permission lookup.
5. Direct URL/API authorization independent of hidden UI.
6. Session fixation, expiry, cookie settings, logout, and revocation behavior where applicable.
7. Local/dev bypass cannot leak into production behavior.
8. No credentials/tokens are logged or returned to the browser unnecessarily.
9. Negative tests prove unauthorized roles cannot perform protected actions.

Do not trust client-supplied role, employee code, or privilege claims.

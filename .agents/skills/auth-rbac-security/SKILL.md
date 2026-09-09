---
name: auth-rbac-security
description: Use for IAM/Azure login integration, user identity mapping, sessions/tokens, roles, permissions, access control, protected pages/APIs, or security review of the FPT web project.
---

# Authentication and RBAC security workflow

Treat authorization as server-side policy, not UI state.

Check:
1. authentication source and trusted identity claims,
2. stable user mapping and account lifecycle behavior,
3. token/session validation and expiry,
4. role/permission lookup,
5. least-privilege access,
6. direct URL/API access,
7. IDOR risks,
8. CSRF/XSS/injection exposure relevant to the changed path,
9. secret or sensitive-data leakage,
10. logout/revocation behavior when applicable.

Never trust a role, employee identifier, or privilege sent by the client without server-side verification.

For a security-sensitive change, add negative tests proving an unauthorized user cannot perform the action.

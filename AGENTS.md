# FPT Internship Web Project — Codex Project Instructions

## Scope

This repository is for the FPT internship web/backend system.

Explicitly out of scope for these instructions:
- device crawler,
- device emulator,
- crawling selectors,
- Shadow DOM device automation.

Focus on the web application, backend, database, authentication/authorization, dashboard, testing, and maintainability.

## Working rules

- Read the repository structure and trace the relevant request/data flow before changing code.
- Preserve existing architecture unless a refactor is justified by a concrete defect or requirement.
- Treat IAM/Azure authentication, identity mapping, roles, permissions, sessions, and user data as security-sensitive.
- Never hardcode passwords, tokens, API keys, client secrets, connection strings, or private user data.
- Validate server-side authorization even if the UI hides an action.
- Make database/model changes through the project's migration mechanism.
- Avoid destructive migrations or data rewrites without clearly identifying the risk.
- Prefer small, reviewable fixes over broad rewrites.
- Add or update tests for changed behavior.
- Do not make a failing test pass by weakening the requirement unless the requirement itself is proven wrong.
- Keep frontend and backend contracts synchronized.
- Report files changed, tests run, and any unresolved risk.

## For authentication and authorization changes

Verify:
1. unauthenticated behavior,
2. authenticated behavior,
3. role/permission boundaries,
4. direct URL/API access,
5. session/token handling,
6. logout/revocation behavior where relevant,
7. sensitive information exposure.

## Definition of done

A task is complete when:
- the root cause/requirement is understood,
- the change is minimal and coherent,
- affected tests pass,
- security and permission impact is checked,
- no secrets are introduced,
- the final summary lists validation performed.

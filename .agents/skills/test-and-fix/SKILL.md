---
name: test-and-fix
description: Use when a feature is broken, a test fails, an exception occurs, or behavior regresses in the FPT web/backend project.
---

# Test and fix workflow

1. Reproduce the failure or inspect the exact failing evidence.
2. Trace the failing path before changing code.
3. Identify the root cause, not only the visible symptom.
4. Add or identify a test that demonstrates the failure.
5. Make the smallest safe fix.
6. Run the focused test.
7. Run related regression tests.
8. Do not disable assertions, hide exceptions, or weaken permissions merely to make tests pass.
9. Report root cause, files changed, tests run, and remaining uncertainty.

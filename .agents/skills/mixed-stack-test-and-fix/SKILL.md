---
name: mixed-stack-test-and-fix
description: Use when behavior is broken or tests fail in this mixed PHP/Python/JavaScript/Django repository.
---

# Mixed-stack test and fix workflow

1. Reproduce or inspect exact evidence.
2. Identify which layer owns the failure.
3. Trace cross-layer contracts before editing.
4. Add or identify the narrowest regression test.
5. Make the smallest safe fix.
6. Run focused checks first:
   - Python unittest/pytest-compatible tests,
   - Node assertion scripts,
   - PHP regression scripts,
   - Django checks/tests where relevant.
7. Run broader related checks when practical.
8. Never hide exceptions, weaken authorization, or delete assertions to make tests pass.
9. Report pre-existing failures separately from regressions introduced by the change.

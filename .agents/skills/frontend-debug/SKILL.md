---
name: frontend-debug
description: Use for HTML, CSS, JavaScript, dashboard interactions, forms, navigation, frontend API calls, browser console errors, or UI regressions in the FPT web project.
---

# Frontend debug workflow

1. Identify the page/component and expected behavior.
2. Inspect rendered state and relevant JS/CSS/template code.
3. Trace frontend request/response contracts when data is involved.
4. Check console errors and failed requests when browser tooling is available.
5. Fix the smallest source of truth instead of adding duplicate workaround code.
6. Verify loading, success, empty, error, and permission-denied states when relevant.
7. Check that hidden/disabled UI is not being used as the only authorization control.
8. Use Playwright MCP for end-to-end verification when installed and appropriate.

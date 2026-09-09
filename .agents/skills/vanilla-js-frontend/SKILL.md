---
name: vanilla-js-frontend
description: Use for portal/dashboard HTML, CSS, vanilla JavaScript, Fetch calls, DOM manipulation, forms, loading/error/permission states, accessibility, or frontend/API contract regressions.
---

# Vanilla JS frontend workflow

1. Do not introduce React/Vue/TypeScript/bundlers unless explicitly required.
2. Trace the DOM element, event handler, Fetch call, and API response contract.
3. Handle loading, success, empty, validation, permission-denied, and server-error states where relevant.
4. Avoid duplicate sources of truth for UI state.
5. Keep authorization server-side; hidden buttons are not security controls.
6. Preserve accessibility labels/focus behavior for interactive changes.
7. Use Playwright MCP for critical browser-flow verification when appropriate.

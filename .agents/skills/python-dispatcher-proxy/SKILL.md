---
name: python-dispatcher-proxy
description: Use for run_all.py, ThreadingHTTPServer routing, static file serving, path allowlists, reverse proxying to PHP/Django, forwarded headers, compression, or dispatcher security.
---

# Python dispatcher / proxy workflow

1. Trace path classification before editing routing.
2. Preserve strict static-file path normalization and traversal protections.
3. Validate allowlists/denylists for sensitive repository files.
4. Preserve correct forwarding of method, path, query, content type, body, and required headers.
5. Be careful with Host/X-Forwarded-* semantics and trust boundaries.
6. Preserve gzip/content-length correctness.
7. Check timeout/error handling for PHP and Django upstreams.
8. Run dispatcher security tests after routing/static changes.

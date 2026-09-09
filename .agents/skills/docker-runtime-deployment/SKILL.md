---
name: docker-runtime-deployment
description: Use for Dockerfile, Docker Compose, entrypoint/startup logic, Composer/pip build stages, PHP extensions, Gunicorn, health checks, runtime users, or deployment behavior.
---

# Docker/runtime workflow

1. Inspect the multi-stage build and runtime entrypoint before changing images.
2. Preserve reproducible dependency installation.
3. Keep runtime non-root where already designed.
4. Verify required PHP extensions, Python packages, static assets, and Gunicorn startup.
5. Treat startup migrations as a high-risk deployment step.
6. Avoid embedding secrets in Dockerfile/image layers.
7. Check healthcheck and process-failure behavior.
8. Build the image after meaningful Docker changes when practical.

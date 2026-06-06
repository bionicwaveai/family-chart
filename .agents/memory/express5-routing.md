---
name: Express 5 wildcard routes
description: Express 5 rejects the bare "*" route string at startup
---

# Express 5 wildcard / catch-all routes

`app.get('*', ...)` throws `PathError: Missing parameter name at index 1: *` at
startup in Express 5 (path-to-regexp v8). The bare `*` and `:param`-less patterns
are no longer valid.

**Why:** Express 5 upgraded path-to-regexp, which dropped the loose `*` syntax.
A common SPA catch-all copied from Express 4 examples crashes the server on boot.

**How to apply:** For a multi-page static site, you usually don't need a catch-all
at all — `express.static(dir)` already serves `index.html` for `/` and serves each
file directly. If you genuinely need a catch-all (true SPA), use a named splat like
`app.get('/*splat', ...)` or a regex, not `'*'`.

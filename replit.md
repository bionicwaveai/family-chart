# family-chart

A D3.js-based JavaScript library for creating beautiful, interactive family trees, plus a set of runnable examples and a visual tree builder.

## Project Architecture

- **Language/Build**: TypeScript library bundled with Rollup (`node build.js` → `dist/`). This is the published npm package build and is unrelated to running the demo site.
- **Demo/Dev server**: Vite serves the root `index.html` (redirects to the visual builder at `/examples/create-tree.html`) and all example pages under `examples/`.
- **Package manager**: Yarn (`yarn.lock`).
- **Source**: `src/` (core, layout, renderers, store, handlers, features, styles).
- **Examples**: `examples/` — HTML demos that import directly from `src/`. They fetch sample data from `examples/data/` (and some from a remote doc host).

## Replit Setup

- **Workflow** "Start application": `yarn dev` (Vite) on port 5000, host `0.0.0.0`.
- Vite `server.allowedHosts: true` so the Replit preview proxy/iframe works.
- **Deployment**: static target. Build runs `npx vite build` which bundles the root page and every `examples/**/*.html` entry into `dist/`, then a Vite plugin copies `examples/data` into `dist/examples/data` so runtime `fetch()` of local sample data works in production. `publicDir` = `dist`.

## User Preferences

(none recorded yet)

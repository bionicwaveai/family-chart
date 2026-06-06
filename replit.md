# family-chart

A D3.js-based JavaScript library for creating beautiful, interactive family trees, plus a set of runnable examples and a visual tree builder.

## Project Architecture

- **Language/Build**: TypeScript library bundled with Rollup (`node build.js` → `dist/`). This is the published npm package build and is unrelated to running the demo site.
- **Demo/Dev server**: Vite serves the root `index.html` (redirects to the visual builder at `/examples/create-tree.html`) and all example pages under `examples/`.
- **Package manager**: Yarn (`yarn.lock`).
- **Source**: `src/` (core, layout, renderers, store, handlers, features, styles).
- **Examples**: `examples/` — HTML demos that import directly from `src/`. They fetch sample data from `examples/data/` (and some from a remote doc host).

## Persistence (shared family tree)

- **Database**: Replit-managed PostgreSQL. Single table `family_tree` holds one shared tree as a JSONB document (constrained to a single row, `id = 1`).
- **Backend**: `server/index.js` — small Express API. `GET /api/tree` returns the saved tree (or the `examples/data/data-first-node.json` default if nothing saved yet); `PUT /api/tree` replaces it. Reads `DATABASE_URL` from the environment.
- **Frontend**: `examples/create-tree.html` (the visual builder everyone lands on) loads from `/api/tree` on startup and autosaves the full dataset (debounced 600ms) via the library's `setOnChange`/`exportData` on every add/edit/remove. It has rich custom fields (dates, profile photo, marriage/divorce dates, social links), per-card hover edit/add action buttons, and shows each person's birthday on the card.
- **Whole-tree overview**: `examples/big-tree.html` reads the same `/api/tree` data and renders the entire tree fit-to-screen (read-only, click a person to re-center, search by name). Reachable from the icon rail (the tree icon below the menu button, wired in `examples/sidebar.js`).
- Single shared tree, last write wins. No auth, no per-user trees, no live multi-user sync (changes appear on next reload).

## Replit Setup

- **Workflow** "Start application": `yarn dev` → runs the Express API (localhost:3001) and Vite (port 5000, host `0.0.0.0`) together via `concurrently`. Vite proxies `/api` → `http://localhost:3001`.
- Vite `server.allowedHosts: true` so the Replit preview proxy/iframe works.
- **Deployment**: autoscale target. Build runs `npx vite build` which bundles the root page and every `examples/**/*.html` entry into `dist/` (a Vite plugin copies `examples/data` into `dist/examples/data` for runtime `fetch()` of sample data). Run command is `npm run start` (`NODE_ENV=production node server/index.js`), which serves the built `dist/` static files and the `/api` endpoints together on port 5000 (binds `0.0.0.0` in production).
- Library build (`node build.js` → Rollup) is unchanged and independent of the demo site/server.

## User Preferences

(none recorded yet)

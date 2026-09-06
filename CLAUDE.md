# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a freshly scaffolded Nuxt 4 project (`npx nuxi init`), currently unmodified from the default starter. `app/app.vue` only renders `<NuxtRouteAnnouncer />` and `<NuxtWelcome />` — there is no application code, routing, components, state management, or styling yet. There is no test runner, linter, or CI configured. Treat any architectural conventions as yet to be established, and set them up as needed rather than assuming a pattern exists.

## Commands

```bash
npm install       # install dependencies (auto-runs `nuxt prepare` via postinstall)
npm run dev        # start dev server at http://localhost:3000
npm run build       # production build
npm run generate     # static site generation
npm run preview      # preview a production build locally
```

There are no lint or test scripts defined yet.

## Architecture

- Built on Nuxt 4 (`nuxt.config.ts` at repo root) with Vue 3 and vue-router.
- Source lives under `app/` (Nuxt 4's default `srcDir` convention) — put pages, components, layouts, composables, etc. in `app/` (e.g. `app/pages/`, `app/components/`) following standard Nuxt auto-import/auto-routing conventions, rather than at the repo root.
- `.nuxt/` is generated build/type-inference output (gitignored) — never edit it directly; it regenerates from `nuxt prepare`/`nuxt dev`/`nuxt build`.
- `public/` holds static assets served as-is.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score (see `README.md`). The project follows a spec-driven workflow (`/spec` and `/spec-impl`, from `Klerith/fernando-skills`). It is currently a fresh Next.js scaffold: `app/` only has `layout.tsx`, `page.tsx` and `globals.css`.

## Commands

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start (after build)
npm run lint    # eslint (flat config in eslint.config.mjs)
```

There is no test runner configured.

## Next.js version caveat

`AGENTS.md` warns that this Next.js (16.4.x, React 19.3) has breaking changes from what you may know. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`; start at `index.md`).

## Configuration notes

- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. `cacheComponents` changes caching and rendering semantics for the App Router, so check the docs before using data fetching or caching.
- Tailwind v4 is wired through Turbopack. `next.config.ts` has a `turbopack.rules` entry that runs `*.css` through `@tailwindcss/turbopack`. Styles come from `@import "tailwindcss"` and `@theme inline` tokens in `app/globals.css`, not a `tailwind.config` file.
- Path alias: `@/*` maps to the project root (not `src/`).
- `next dev` regenerates the `AGENTS.md` block, so commit it rather than removing it.

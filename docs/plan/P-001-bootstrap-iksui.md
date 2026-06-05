# P-001 — Bootstrap ikui component library

Status: completed
Task: T-001

## Goal

Derive a clean, copy-paste React component library named **ikui** from the
spell-ui project, keeping the registry + docs-site architecture and dropping the
SaaS surface (auth, database, payments, blog, settings).

## Scope decisions (approved)

- A2 (clean derivation) + B1 (bring all components) + pnpm 11.
- UI primitives: **@base-ui/react only** — remove all `@radix-ui/*` and `radix-ui`.
- Upgrade all dependencies to latest stable.
- Lint/format with `@biomejs/biome` (config copied from work/blog/biome.json,
  path globs adapted), replacing ESLint.
- Drop `spotify-card` (only backend-coupled component) and content-collections
  (blog-only).

## Steps

1. Copy library files, strip business modules — verify: no refs to db/auth/whop/blog. ✅
2. Migrate Radix → base-ui — verify: no `@radix-ui` / `radix-ui` imports remain. ✅
3. Rebrand spell → ik, spell-ui → ikui, spell.sh → placeholder — verify: grep clean. ✅
4. Upgrade deps, pin latest, add biome, remove eslint — verify: package.json clean. ✅
5. `pnpm install` + `pnpm build` + `pnpm biome check` — verify: all pass. ✅

## Result

- `pnpm build` green: 47 routes (homepage + docs index + 32 component docs + introduction/components/mcp).
- `pnpm biome check` green: 140 files, 0 errors.
- pnpm 11.5.1; all deps on latest (Next 16.2, React 19.2, Base UI 1.5, Tailwind 4.3, TS 6, Biome 2.4).
- 32 registry components retained; `spotify-card` dropped (backend-coupled).
- Radix fully removed: 4 registry + `button`/`breadcrumb`/`sidebar` use a local zero-dep `lib/slot.tsx`;
  `avatar`/`tabs`/`tooltip`/`popover`/`separator`/`sheet`/`dropdown-menu` migrated to Base UI;
  unused `collapsible`/`dialog`/`toggle`/`label` deleted.

## Known minor deviations

- `components/mobile-nav.tsx` still uses Radix CSS-var names (`--radix-popover-content-available-*`)
  in a className string; non-breaking, full-height mobile dropdown sizing is cosmetic.
- `biome.json` copied from work/blog with `files.includes` excludes adapted to this repo's
  layout (`components/ui/**`, `registry/ikui/**`).

## Notes

- jotai retained (state lib, not a UI primitive).
- Component docs live under `docs/<name>/`; PMA tracking under `docs/task` & `docs/plan`.

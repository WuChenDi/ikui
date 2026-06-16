# AGENTS.md

Guidance for AI agents working in this repository.

## Project

**ikui** — a copy-paste React component library plus its documentation site.
Derived from the MIT-licensed [spell-ui](https://github.com/xxtomm/spell-ui),
re-themed onto [Base UI](https://base-ui.com) primitives. Components are
distributed through a shadcn-style registry (`registry.json` → `public/r/*.json`),
not published as an npm package.

Live site / registry: https://ik-ui.pages.dev

## Stack

- **Next.js 16** (App Router, RSC, `--webpack`) + **React 19**
- **Tailwind CSS 4** (CSS-first, `src/app/globals.css`; no `tailwind.config`)
- **Base UI** (`@base-ui/react`) as the only UI primitive layer — **no Radix**
- **MDX** docs via `@next/mdx` (`remark-code-import`, `remark-gfm`,
  `rehype-slug`, `rehype-autolink-headings`, Shiki highlighting)
- **Biome** for lint + format (replaces ESLint/Prettier)
- **TypeScript 6** (strict), **pnpm 11**, **Node >= 22**
- Animations: `motion`; icons: `lucide-react`

## Commands

```bash
pnpm dev              # next dev (wrapped by `nsl run --name ikui`), http://ikui.localhost:3355
pnpm build            # next build --webpack
pnpm lint             # biome check .
pnpm format           # biome format --write .
pnpm registry:build   # shadcn build → regenerate public/r/*.json from registry.json
pnpm clean            # remove node_modules/.next/out/dist
```

Always run `pnpm lint` before considering a change done. There is no test suite;
verify by building and by checking the rendered docs page for the component.

## Layout

```
registry/ikui/        # the actual component source — what users copy/install
docs/<name>/          # per-component docs: doc.mdx + demo.tsx (+ demo-*.tsx variants)
registry.json         # registry manifest (source of truth for sidebar + install)
public/r/*.json       # generated registry output (do not hand-edit)
src/app/              # Next.js App Router (docs, og, api/github/stars, sitemap…)
src/components/       # site chrome (header, sidebar, mdx widgets); ui/ = shadcn primitives
src/lib/              # utils (cn, metadata), registry/doc loaders, config, types
src/mdx-components.tsx # MDX component map (DemoCanvas, InstallationTabs, PropsTable…)
docs/plan, docs/task  # PMA workflow tracking (see below)
```

Path aliases (`tsconfig.json`): `@/*` → `src/*` and repo root; `@/docs/*` → `docs/*`.

## Conventions

- **Code style** is enforced by Biome — do not fight it:
  - single quotes, semicolons as-needed, 2-space indent.
  - `import type { ... }` required for type-only imports (separated style).
  - imports are auto-organized; `import * as z from "zod"` (never `{ z }`).
  - floating/misused promises are errors.
- `src/components/ui/**` and `registry/ikui/**` are **excluded from Biome** —
  they follow upstream shadcn/Base UI formatting; match it, don't reformat.
- Use `cn()` from `@/lib/utils` for class merging.
- Registry components should be self-contained and copy-pasteable: minimal deps,
  declare every external dep in the registry item's `dependencies` /
  `registryDependencies`.

## Adding a component

Four files, per `CONTRIBUTING.md`:

1. `registry/ikui/<name>.tsx` — the component.
2. `registry.json` — add an item (`name`, `title`, `description`, `files`,
   `dependencies`, `registryDependencies`, `category`).
3. `docs/<name>/demo.tsx` — a demo (add `demo-*.tsx` for variants).
4. `docs/<name>/doc.mdx` — docs using `DemoCanvas`/`InstallationTabs`/`PropsTable`.

Then run `pnpm registry:build`. The sidebar and doc routing are generated from
`registry.json` (see `src/lib/doc.ts` for category labels/order), so no manual
nav edits are needed.

### Doc page structure

Every `doc.mdx` follows the same section skeleton, in this fixed order:

```mdx
{/* Hero: the raw component — no business scaffolding */}
<DemoCanvas>
  <DemoPreview><Demo /></DemoPreview>
  <DemoCode>```tsx file=./demo.tsx ```</DemoCode>
</DemoCanvas>

One short intro paragraph (optional) — what the component is, right here.

## Installation   {/* <InstallationTabs> */}
## Usage          {/* import + one minimal snippet */}
## Composition    {/* compound (multi-export) components only — text tree */}
## Examples       {/* every live-preview variant as a ### sub-section */}
## Props          {/* <PropsTable> — one per sub-component */}
```

Rules:

- **Order is fixed**: Hero → Installation → Usage → (Composition) → Examples →
  Props. Don't reorder.
- **The hero `demo.tsx` is the rawest display of the component** — just the
  component with minimal props, no business scaffolding (no zoom/seek controls,
  percentage/clock readouts, info captions, surrounding video/audio players,
  etc.). The component's own controlled state or built-in interaction is fine
  (e.g. `image-crop`'s controlled `crop`, the ruler's own scrollbar). Anything
  that wraps business logic around the component is an Example, not the hero.
- **Every live-preview example is a `###` under `## Examples`** — never a
  top-level `##`. A no-preview usage detail (prose + code, no `DemoCanvas`) may
  stay as a `###` under `## Usage`.
- **Intro prose goes in the paragraph under the hero, not inside `demo.tsx`.**
- `## Composition` only for compound components; omit otherwise.
- Keep `## Props` + `PropsTable`; no RTL section; metadata stays in
  `registry.json` (no mdx frontmatter).

## PMA workflow

This repo is managed with the **PMA skill**. Follow the three phases strictly —
investigate → proposal → implement — and use the file-based tracking:

- Plans: `docs/plan/P-XXX-*.md`
- Tasks: `docs/task/` (index in `docs/task/index.md`)

Do not skip phases or bypass the task files for non-trivial work.

## Notes / gotchas

- `mobile-nav.tsx` still references `--radix-popover-content-available-*` CSS
  vars in a className string (cosmetic, non-breaking leftover from migration).
- `webpack` config adds a `?raw` resourceQuery loader so MDX/source files can be
  imported as raw strings for the code-preview blocks.
- `/docs/:slug.md` is rewritten to `/docs/:slug/md` (raw markdown export route).
- Remote-visible Git metadata (commits, PRs) must be English and must not mention
  AI agents/assistants.
- **Timeline primitives — right-edge overflow.** The time-scaled content box is
  exactly `contentWidth = duration * pixelsPerSecond * zoom`, and that width must
  stay exact because the tracks/waveform below it (and any consumer) lay out
  against the same value — widening it to make room desyncs them. Children are
  positioned `left = time * pps` and extend **rightward** from that anchor, so
  anything landing on the right edge (`time === duration`) spills past the box and
  gets clipped or pokes out of the card. Each timeline primitive handles this
  internally rather than padding `contentWidth`:
  - `timeline-ruler`: the final tick line (1px) right-anchors (`right: 0`) when
    it sits on the edge; a label keeps its anchor at the tick but flips to extend
    **leftward** (`translateX(-100%)`) when its estimated text width would overflow
    (`left + textWidth > contentWidth`) — so it stays at the correct time instead
    of being pinned to the content edge. Labels have no separate tick line; the
    text itself is the marker, hence the text-width test rather than anchor pos.
  - `timeline-playhead`: the 2px line clamps to `[0, contentWidth - 2]` and the
    12px knob (centred on the line) clamps its centre to `[6, contentWidth - 6]`
    via an extra `translateX`, so both ends hug the edge instead of overhanging.
  When adding any timeline child that draws at the extremes, keep `contentWidth`
  exact and inset/edge-anchor the element itself.

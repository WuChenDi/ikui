# P-013 — Add Blocks section (shadcn-style) with audio-trimmer block

Status: completed
Task: T-013

## Goal

A standalone **Blocks** section for business compositions built from the pure
primitives — the home for "many business combinations" going forward, modeled on
shadcn's `/blocks` (clone in `tmp/ui/apps/v4`). First block: **audio-trimmer**.

Mirror shadcn's structure/behavior, adapted to ikui's Base UI stack (Radix
forbidden, so its `ui/*` cannot be copied verbatim):

- each block is a `registry:block` item, installable via `pnpm registry:build`.
- preview rendered in an **isolated iframe** at its own route (style/layout
  isolation), with responsive width toggle (Desktop / Tablet / Mobile).
- Preview / Code toggle; Code = Shiki-highlighted source + copy + install cmd.

Deviation from shadcn (recorded): discrete width breakpoints via state instead of
pulling in `react-resizable-panels` for a drag handle (minimal-deps); single-file
code view (no file tree) since the block is one file. Both extensible later.

## Proposal / scope

1. **Block source** `registry/ikui/blocks/audio-trimmer.tsx` — self-contained
   `AudioTrimmer` (composes `timeline-ruler` + `timeline-element` +
   `audio-waveform` + `timeline-playhead`; play only the trimmed
   `[startTime, startTime + duration]`, playhead follows, In/Out/length readout).
   Imports use consumer paths `@/components/<name>` (published-correct).
2. **tsconfig paths** — add `@/components/timeline-ruler|timeline-element|timeline-playhead`
   → `registry/ikui/*.tsx` (audio-waveform already mapped) so the block resolves
   in-repo for the iframe render.
3. **registry.json** — add the `registry:block` item (`category: "blocks"`,
   `registryDependencies` = the four `@ikui/*` primitives). `registry:build`
   emits `public/r/audio-trimmer.json`. `doc.ts` filters `registry:component`, so
   Components sidebar is unaffected.
4. **lib** — `getBlocks()` (filter registry items by `registry:block`);
   `highlight-code.ts` (`codeToHtml`, themes `github-light`/`github-dark`,
   `defaultColor:false` — same as the MDX pipeline, reuses global `.shiki` CSS).
5. **Pages** — `src/app/blocks/page.tsx` (landing: SiteHeader + list of
   `BlockViewer`s) and `src/app/blocks/view/[name]/page.tsx` (bare full-bleed
   block render = iframe src; `generateStaticParams` over blocks).
6. **`src/components/block-viewer.tsx`** (client) — Preview/Code tabs; width
   toggle; refresh (iframe key); open-in-new; install command (reuse
   `CodeBlockCommand`); code via highlighted HTML.
7. **`site-header.tsx`** — add `Blocks` → `/blocks` nav link.

Reverted T-012's doc.mdx Example + removed its demo file.

## Steps

1. Block source + tsconfig paths + registry.json; `pnpm registry:build`.
   verify: `public/r/audio-trimmer.json` emitted with inlined content + deps.
2. lib + view route + landing + viewer + nav.
   verify: `/blocks` lists it; iframe renders the trimmer; width toggle + Code
   tab + copy work.
3. `pnpm lint` + `pnpm build`.
   verify: green; `/blocks` and `/blocks/view/audio-trimmer` prerendered.

## Result

Shipped a standalone **Blocks** section, shadcn-modeled, on ikui's Base UI stack.

- `registry/ikui/blocks/audio-trimmer.tsx` — self-contained `AudioTrimmer`
  composing the four timeline primitives (consumer-path imports).
- `registry.json` — `audio-trimmer` `registry:block` (deps `lucide-react`;
  registryDependencies = the four `@ikui/*`); `public/r/audio-trimmer.json` emits
  with inlined content → installable via `npx shadcn add @ikui/audio-trimmer`.
- `tsconfig.json` — added `@/components/timeline-{ruler,element,playhead}` paths
  so the block resolves in-repo for the iframe render.
- `src/lib/types.ts` — `RegistryItem.type` gains `registry:block`.
- `src/lib/blocks.ts` (`getBlocks` / `getBlock` / `getBlockCode`, source read
  scoped to a literal subfolder to avoid over-tracing) + `src/lib/highlight-code.ts`
  (Shiki dual-theme, reuses global `.shiki` CSS).
- `src/app/blocks/page.tsx` (landing) + `src/app/blocks/view/[name]/page.tsx`
  (bare full-bleed iframe target, static).
- `src/components/block-viewer.tsx` — Preview/Code tabs, Desktop/Tablet/Mobile
  width toggle, refresh, open-in-new, install command + copy.
- `site-header.tsx` — `Blocks` nav link.

Note: the AGENTS claim that `registry/ikui/**` is Biome-excluded is stale — only
`src/components/ui/**` is; registry files are linted/formatted.

### Fidelity pass (follow-up)

First viewer was too flat vs. shadcn. Reworked `block-viewer.tsx` to mirror the
shadcn block-viewer (`tmp/ui/apps/v4/components/block-viewer.tsx`):

- added `react-resizable-panels@4` + copied `src/components/ui/resizable.tsx`
  (framework-agnostic, not Radix) — real drag-to-resize preview.
- dotted radial-gradient **canvas** with the iframe floating in a resizable
  rounded panel + `bg-muted/50` backing; device toggle calls
  `panelRef.resize('100%' | '60%' | '30%')`.
- Code view is a **code card**: filename header bar (`components/<name>.tsx`) +
  copy button + scrollable Shiki body.
- toolbar layout matches shadcn: Tabs pill | description anchor | device pill
  (toggle + open-new + refresh) | `npx shadcn add @ikui/<name>` button.
- mobile (`lg:hidden`) falls back to a plain iframe (no static images / no
  resize), since ikui has no prerendered block screenshots.

Reverted T-012's `docs/timeline-element/doc.mdx` Example + removed its demo file.
`pnpm registry:build` + `pnpm lint` clean; `pnpm build` EXIT=0, no warnings;
`/blocks` and `/blocks/view/audio-trimmer` prerendered.

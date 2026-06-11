# P-003 — Unify component doc page structure

Status: completed
Task: T-003

## Goal

Every component's `doc.mdx` currently orders its sections differently and nests
examples inconsistently (some as top-level `##`, some under `## Examples`).
Define one canonical doc page structure, document it in `AGENTS.md`, and bring
the existing docs into line.

## Canonical structure (approved)

```
Hero <DemoCanvas> (+ optional 1-paragraph intro under it)
## Installation   — <InstallationTabs>
## Usage          — import + minimal snippet
## Composition    — only for compound components (text tree)
## Examples       — every live-preview variant as ### sub-sections
## Props          — <PropsTable> (one per sub-component)
```

Rules:
1. Section order is fixed: Hero → Installation → Usage → (Composition) →
   Examples → Props.
2. Every live-preview example lives under `## Examples` as a `###`. No example
   as a top-level `##`.
3. Component intro prose goes in the paragraph under the hero, never inside
   `demo.tsx`.
4. `## Composition` only appears for compound (multi-export) components.
5. Keep `## Props` + `PropsTable` — already uniform, do not rename.
6. No RTL section (the media components don't need it).
7. Metadata stays in `registry.json`; no mdx frontmatter (unlike shadcn).

## Non-conforming docs to fix

- `copy-button` — Examples sits before Usage. Reorder to after Usage.
- `particle-image` — Examples sits before Usage. Reorder to after Usage.
- `image-compare` — `## Vertical` is a top-level example. Demote to
  `## Examples` / `### Vertical`, placed after Usage.
- `image-crop` — `## Fixed aspect ratio with preview` and `## Custom styling`
  are top-level examples. Group under `## Examples` after Usage.
- `timeline-ruler` — `## In a timeline` is a top-level example. Demote to
  `## Examples` / `### In a timeline` after Usage. Keep the no-preview
  `### Embedding above tracks` snippet under Usage.

Conforming (no change): `audio-waveform`, `waveform-player`,
`segmented-timeline-strip`, `thumbnail-strip` (already Installation → Usage →
Props with no examples).

## Steps

1. `AGENTS.md` — add a "Doc page structure" subsection under Conventions.
   verify: section present, rules listed.
2. Reorder/restructure the 5 non-conforming `doc.mdx` files.
   verify: `grep '^## '` shows the canonical order; no example as top-level H2.
3. `pnpm lint` + `pnpm build`.
   verify: green; the affected docs pages prerender.

## Result

- `AGENTS.md` — added a "Doc page structure" subsection under "Adding a
  component" with the fixed section order and rules.
- Reordered 5 docs to Hero → Installation → Usage → (Examples) → Props:
  - `copy-button`, `particle-image` — moved `## Examples` after `## Usage`.
  - `image-compare` — demoted top-level `## Vertical` to `## Examples` /
    `### Vertical`.
  - `image-crop` — grouped `## Fixed aspect ratio with preview` and
    `## Custom styling` under `## Examples` as `###`.
  - `timeline-ruler` — demoted `## In a timeline` to `## Examples` /
    `### In a timeline`; kept the no-preview `### Embedding above tracks`
    snippet under `## Usage`.
- No content rewritten — only section nesting/order changed.
- Verified: `pnpm lint` green (102 files), `pnpm build` green — all
  `/docs/[id]` pages prerender.

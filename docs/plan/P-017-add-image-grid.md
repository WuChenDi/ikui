# P-017 — Add image-grid component (adaptive 1-9 photo grid)

Status: completed
Task: T-017

## Goal

Add an `image-grid` registry component — a pure, responsive photo grid that
adapts its layout to the number of images (WeChat-moments / nine-grid style):
1–4 images use a square mosaic, 5–9 use a uniform 3-column square grid.

## Current state

- Reference `tmp/test.html` is a Vue2 demo: a 6×6 CSS grid where 1–4 images are
  laid out with `grid-column/row: span N` (1 = full, 2 = two half-width full-
  height, 3 = one tall + two stacked, 4 = quadrant). It uses fixed 50px cells
  and leaves 5–9 to an unimplemented `default-layout`.
- ikui ships image-category primitives (`image-compare`, `image-crop`) as pure
  `registry/ikui/*.tsx`. Convention: primitives stay business-free; click /
  lightbox lives in the consumer/demo (memory: keep registry primitives pure).
- `<img>` triggers the Biome `next` domain `noImgElement` rule → needs a
  `biome-ignore` (same as `image-compare`). a11y group is not enabled, so a
  clickable `<div>` needs no key-handler ignore.

## Proposal

`registry/ikui/image-grid.tsx` (`registry:component`, `category: image`):

- Props: `images: { src; alt? }[]`, `gap?` (px, default 4), `className?`,
  `onImageClick?(index)`, `renderImage?(image, index)` for custom rendering
  (lets consumers wrap each cell in a lightbox trigger).
- Render up to 9 images (`slice(0, 9)`); the nine-grid cap is the defining
  trait. Empty array → render nothing.
- Layout (responsive, container fills parent width):
  - **1–4 (mosaic):** `grid-template-columns/rows: repeat(6, 1fr)`,
    `aspect-ratio: 1`; per-index `gridColumn/gridRow: span N` reproducing the
    reference (1 full; 2 → two 3×6; 3 → 3×6 + two 3×3; 4 → four 3×3).
  - **5–9 (grid):** `grid-template-columns: repeat(3, 1fr)`, auto rows; each
    cell `aspect-square`.
- Each cell: `overflow-hidden`, `cursor-pointer` when `onImageClick` set;
  default `<img class="h-full w-full object-cover">` (with `noImgElement`
  biome-ignore).
- Registration:
  - `registry.json` item: `dependencies: []`, `registryDependencies: []`,
    `category: "image"`.
  - `tsconfig.json`: `@/components/image-grid` → `registry/ikui/image-grid.tsx`.
- Docs `docs/image-grid/`:
  - `demo.tsx` — hero: raw `<ImageGrid>` with a handful of images.
  - `doc.mdx` — Hero → Installation → Usage → Examples (1/2/3/4 mosaic + a
    5–9 grid) → Props (`PropsTable` for `ImageGridProps`).

## Risks

- Mosaic cells are not perfectly square once `gap` is applied (gaps are
  subtracted from the square container); visually negligible, matches the
  reference's behavior.
- No `+N` overflow badge for >9 images — that is business logic; consumers add
  it via `renderImage`. Documented.

## Verify

- `pnpm lint` clean.
- `pnpm registry:build` regenerates `public/r/image-grid.json`.
- Docs page renders the hero and all examples.

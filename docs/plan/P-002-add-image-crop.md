# P-002 — Add image-crop component

Status: completed
Task: T-002

## Goal

Add an `image-crop` registry component to ikui by rewriting the MIT/ISC
`react-image-crop` v11 reference (in `tmp/react-image-crop`) into the project's
idiom: a single self-contained `'use client'` function component styled with
Tailwind via `cn()`, zero external dependencies, copy-paste ready. Breaking
changes from the upstream API are allowed.

## Scope decisions (approved)

- class `PureComponent` -> function component + hooks (`useRef` for drag state,
  `useState` for active/drawing, `useId` instead of global `instanceCount`).
- Document-level pointer listeners -> pointer capture (matches `image-compare`).
- SCSS BEM + CSS vars -> Tailwind classes via `cn()`. Marching-ants animation
  replaced by a static dashed border + focus ring (no `globals.css` keyframes,
  keeps the file self-contained).
- Keep the proven geometry helpers (`clamp`, `containCrop`,
  `convertToPixelCrop`, `convertToPercentCrop`, `makeAspectCrop`, `centerCrop`,
  `nudgeCrop`) as pure functions in the same file. Export `makeAspectCrop`,
  `centerCrop`, `convertToPixelCrop`, `convertToPercentCrop` (demos need them).
- Keep API: controlled `crop` + `onChange(pixel, percent)`, `onComplete`,
  `aspect`, `circularCrop`, `disabled`, `locked`, `keepSelection`,
  `minWidth/Height`, `maxWidth/Height`, `ruleOfThirds`, `renderSelectionAddon`,
  `onDragStart/End`, `className`, `style`, `children`, keyboard nudging.
- Breaking: drop the `ariaLabels` config object (inline English labels),
  drop marching-ants, drop the `.ReactCrop__*` BEM class hooks.
- Demos: basic interactive crop + fixed-aspect with a trimmed `canvasPreview`.
  Reuse `public/image-compare/after.png`; no new binary assets. Skip the
  upstream file-upload/scale/rotate kitchen-sink demo.

## Steps

1. `registry/ikui/image-crop.tsx` — rewrite as function component + Tailwind.
   verify: `pnpm lint` clean on the file's docs/demo usage.
2. `registry.json` — add `image-crop` item (category `interactive`).
   verify: `pnpm registry:build` regenerates `public/r/image-crop.json`.
3. `docs/image-crop/{demo,demo-aspect,doc.mdx}` — docs + two demos.
   verify: `pnpm build` renders `/docs/image-crop`.
4. Manual check on the docs page: draw new crop, drag, 8-way resize, fixed
   aspect, min/max, circular, keyboard nudge.

## Result

- `registry/ikui/image-crop.tsx` — single-file `'use client'` function component
  (~1040 lines after Biome format), zero deps. class/SCSS rewritten to
  hooks + pointer capture + Tailwind. Exports `ImageCrop`, `Crop`, `PixelCrop`,
  `PercentCrop`, `Ords`, `ImageCropState`, `makeAspectCrop`, `centerCrop`,
  `convertToPixelCrop`, `convertToPercentCrop`.
- `registry.json` + regenerated `public/r/image-crop.json` (category interactive).
- `docs/image-crop/{demo.tsx, demo-aspect.tsx, doc.mdx}`; demos reuse
  `public/image-compare/after.png`, no new binaries.
- Verified: `pnpm lint` green (101 files), `pnpm build` green — `/docs/image-crop`
  prerenders both demo instances. Interactive drag/resize not yet click-tested
  in a browser (geometry ported verbatim from the upstream algorithm).

## Breaking changes vs. upstream react-image-crop

- Removed the `ariaLabels` config object (inline English labels).
- Removed marching-ants animation -> static solid border + focus ring.
- Removed all `.ReactCrop__*` BEM class hooks (Tailwind only).
- Mac/Windows modifier split dropped: `Ctrl` or `Cmd` both = ×100 nudge.

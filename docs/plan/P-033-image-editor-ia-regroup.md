# P-033 — image-editor Phase 2: IA regroup (8 → 4) + options bar

Status: completed
Task: T-033
Parent: [P-021](./P-021-add-image-editor.md) (Next → Phase 2)

## Goal

Breaking IA change. Collapse the eight-tool rail into four logical groups and
move each tool's contextual controls from below the canvas (the `order` flip)
into an options bar directly above it.

## Groups (8 → 4)

- **Annotate** (`Type`) — text / watermark text / rect / ellipse / arrow / image
  overlay / **Pen** (free draw, folded in from the old Draw tab) + color +
  z-order. Adding any object exits Pen.
- **Redact** (`Grid3x3`) — the mosaic brush, lifted out of Draw with its own
  semantics/icon. Entering the tool turns the brush on; leaving turns it off
  (no Pen/Mosaic mode switch). Size + Block sliders.
- **Adjust** (`SlidersHorizontal`) — filter thumbnail strip **and**
  brightness/contrast/saturation sliders in one panel (old Adjust + Filters
  merged).
- **Geometry** (`Crop`) — Crop (explicit button → image-crop overlay; aspect
  presets + Apply/Cancel while active) / rotate / flip / resize, merged from the
  old Crop + Resize + Transform tabs.

## Layout

- Drop the `order-first` / `order-last` flex flip. Right column DOM order is now
  natural: top bar → options bar (active tool's controls) → canvas stage.
- The options bar wraps; the Adjust panel is the tallest (filter strip + 3
  sliders) and fits within the block's `iframeHeight: 700`.

## Behaviour changes

- `switchTab`: leaving Annotate stops the pen; leaving Redact stops the mosaic;
  leaving Geometry cancels an in-progress crop; entering Redact starts the
  mosaic.
- Crop is now opt-in via a button inside Geometry (was auto-entered on tab
  switch).
- Removed `mosaicMode` state (the tab now expresses mosaic on/off); `add()`
  calls `setDraw(false)` so any annotation exits Pen.
- `watermarkInputRef` → `overlayInputRef` (the image upload now lives in
  Annotate). Removed unused icons (`Eraser`, `Wand2`, `Scaling`).

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, regenerated
`public/r/image-editor.json`. Out: Phase 3 items (floating selection toolbar,
editable stroke width, color↔selection sync, Resize preview) and Known issues
#3/#5/#6 beyond the Redact relabel.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.
- Manual: four groups switch; Pen draws and any add exits it; Redact paints and
  stops on leave; Adjust shows filters + sliders together; Geometry crop button
  opens the overlay, Apply/Cancel work, rotate/flip/resize intact.

## Outcome

Implemented in `registry/ikui/blocks/image-editor.tsx`:
- Rail is now four groups — Annotate (`Type`), Redact (`Grid3x3`), Adjust
  (`SlidersHorizontal`), Geometry (`Crop`). Old Draw/Watermark/Filters/Crop/
  Resize/Transform tabs folded in.
- Right column DOM order is now top bar → options bar → stage (the `order-first`/
  `order-last` flip removed). Options bar sits directly above the canvas.
- Annotate folds in Pen (toggle; any add exits it via `add()`→`setDraw(false)`)
  and the image overlay (`overlayInputRef`) + watermark text. Redact is a
  mosaic-only tool (on while the tab is active). Adjust shows the filter
  thumbnail strip + B/C/S sliders together. Geometry merges crop (explicit Crop
  button → overlay with aspect presets + Apply/Cancel) + rotate/flip + resize.
- Removed `mosaicMode` state and unused icons (`Eraser`, `Wand2`, `Scaling`);
  renamed `watermarkInputRef` → `overlayInputRef`.

Verify: `pnpm biome check` clean; `pnpm registry:build` regenerated
`public/r/image-editor.json`; `pnpm build` exit 0. Interactive click-through
recommended for the new groups + crop sub-mode.

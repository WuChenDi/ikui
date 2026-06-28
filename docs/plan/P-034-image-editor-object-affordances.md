# P-034 — image-editor Phase 3: object affordances

Status: completed
Task: T-034
Parent: [P-021](./P-021-add-image-editor.md) (Next → Phase 3)

## Goal

Bring object-level editing to the object. Resolves the remaining Known issues
#3 (Resize non-WYSIWYG) and #5 (color picker not synced to selection), and adds
a floating selection toolbar.

1. **Floating selection toolbar.** When an object is selected, a small toolbar
   floats just above (or below, near the top edge) the object with: color,
   stroke width (shapes only), duplicate, bring-forward, send-back, delete.
   Follows the object while it is moved / scaled / rotated and reflows on zoom.
2. **Editable stroke width** for the selected shape (#new) via the toolbar
   slider; commits one history frame.
3. **Color ↔ selection sync (#5).** Selecting a coloured object reflects its
   colour back into the picker (text → `fill`, shape → `stroke`).
4. **Export-size badge (#3).** The top bar shows `→ W × H` whenever the Resize
   target differs from the current image dims, making the export-only resize
   explicit.

## Changes (`registry/ikui/blocks/image-editor.tsx`)

- New `sel` state `{ x, top, bottom, showColor, showStroke, strokeWidth }` (stage
  px), driven by a `syncSelection()` wired to `selection:created/updated/cleared`
  + `object:moving/scaling/rotating/modified`. Position from
  `obj.getBoundingRect()` + `canvas.wrapperEl` offset, x clamped to the stage.
  `selSyncRef` lets `applyZoom` reflow the toolbar after a zoom.
- `syncSelection` also pushes the object's colour into `color` (#5).
- `duplicateActive()` (fabric v7 async `clone`), `changeStrokeWidth()` (live set
  + `setSel` mirror; history on slider commit).
- Selection cleared on `restore` and on entering Redact.
- Top bar export badge.

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, regenerated
`public/r/image-editor.json`. Out: a true WYSIWYG resize (kept export-only;
the badge makes it explicit) and any new registry deps.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.
- Manual: select a shape → toolbar appears above it with colour + stroke +
  duplicate/order/delete; drag the object → toolbar follows; zoom → toolbar
  stays anchored; selecting a coloured object updates the picker; set Resize →
  top bar shows `→ W × H`.

## Outcome

Implemented in `registry/ikui/blocks/image-editor.tsx`:
- `sel` state + `syncSelection()` (wired to selection + object:moving/scaling/
  rotating/modified) render a floating toolbar anchored to the active object's
  bounding rect (`getBoundingRect()` + `wrapperEl` offset, x clamped, flips
  below the object near the top edge). `selSyncRef` reflows it after a button
  zoom.
- Toolbar holds colour (text/shape), a stroke-width slider (shapes), duplicate
  (`duplicateActive`, async `clone`), bring-forward / send-back, delete.
- `syncSelection` mirrors the object's colour into the picker (#5). Selection is
  cleared on `restore` and on entering Redact.
- Top bar shows `→ W × H` when the Resize target differs from dims (#3 — still
  export-only by design, now explicit).

Verify: `pnpm biome check` clean; `pnpm registry:build` regenerated
`public/r/image-editor.json`; `pnpm build` exit 0. Interactive click-through
recommended (toolbar follow, stroke edit, colour sync, badge).

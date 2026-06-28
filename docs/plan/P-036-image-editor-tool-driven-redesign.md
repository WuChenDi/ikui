# P-036 — image-editor: tool-driven model + contextual inspector

Status: completed
Task: T-036
Parent: [P-021](./P-021-add-image-editor.md) (Next → breaking interaction redesign)

## Goal

A breaking interaction redesign (Alt-2 of the review). Replace the
"5 tool-category tabs" IA with a **tool-driven canvas** plus a **contextual
right inspector**, and make object insertion **direct-manipulation**. Keeps the
fabric engine, history, crop, mosaic, zoom/pan and export logic intact — only
the interaction surface changes.

Resolves the structural problems found in review:
- 2–3 duplicate entry points for delete / z-order.
- Resize being a dead top-level tab (export-only, non-WYSIWYG).
- Redact tab auto-arming a destructive brush on focus.
- No explicit select/move tool; "tool = current tab" fighting "tool = pointer
  mode".
- Center-only insertion (no place-where-you-click).
- Background editable via Adjust/transform but not addressable as a layer.

## Current state

`registry/ikui/blocks/image-editor.tsx` (single client component). IA = left
vertical `ToggleGroup` rail of 5 tabs (`tab` state: annotate / redact / adjust /
geometry / resize) → top bar (dims+zoom, undo/redo/reset, orphan Delete) →
horizontal `ResizablePanelGroup` [canvas | right]; right = vertical
[options bar | Layers]. A floating selection toolbar carries object props.
`switchTab` does the mode side-effects (start/stop pen & mosaic, cancel crop).

## Proposal (changes — all in `registry/ikui/blocks/image-editor.tsx`)

### 1. Tools replace tabs

New `tool` state (+ `toolRef` mirror for the mount-bound canvas handlers, same
pattern as `mosaicRef`): `select | text | shape | draw | redact | crop | hand`.
Drop `tab` and the `drawing` boolean (folded into `tool === 'draw'`); mosaic
arming is `tool === 'redact'` (not tab focus). Left rail = single-select
`ToggleGroup` of these tools with hotkeys **V T R P M C H** (added to the
existing `onKeyDown`, guarded by `!isTyping()`).

`setTool(next)` centralizes mode transitions (replacing `switchTab`): stop pen
unless draw, `toggleMosaic(next === 'redact')`, enter/exit crop on crossing the
crop tool, set cursor.

### 2. Direct-manipulation insertion (headline change)

`text` and `shape` tools place on the canvas where the user clicks/drags,
instead of `add()`-to-center. New mount-bound `mouse:down/move/up` handlers
(gated on `toolRef`):
- **text**: click → create `IText` at the scene point, enter editing, switch
  back to `select`.
- **shape** (`shapeKind` state: rect / ellipse / arrow; segmented control in the
  inspector's tool section): mouse:down records origin and creates a zero-size
  object; mouse:move resizes it (`width/height` for rect, `rx/ry` for ellipse,
  endpoint for arrow); mouse:up finalizes, selects it, returns to `select`.
- Watermark text becomes a one-click preset action in the text tool section
  (keeps `addWatermarkText`).

These handlers must coexist with the existing pan and mosaic `mouse:*` handlers
— all gate on the active tool / `mosaicRef.on` / pan state, so only one path
runs per event.

### 3. Right panel = contextual inspector (replaces options bar + floating toolbar)

The vertical right `ResizablePanelGroup` keeps **Layers** at the bottom; the top
section becomes a single **contextual inspector**:
- **Object selected** → object properties (the floating-toolbar contents become a
  stable vertical section): color, font family/size/bold/italic/align (text),
  stroke width (shape), opacity, then z-order / duplicate / delete. One home for
  object actions — kills the duplication.
- **Nothing selected** (or the Background layer row clicked, which just
  `discardActiveObject()`) → **Canvas** section: Adjust B/C/S sliders + Filters
  thumbnail strip. This makes "Adjust applies to the whole image" explicit.
- **Tool-specific options** when relevant (shape kind, pen size, mosaic size/
  block, crop aspect + Apply/Cancel) render above the context section.

Remove the floating selection toolbar entirely (`sel` positioning math,
`selSyncRef` reflow, `getBoundingRect` tracking). `syncSelection` is reduced to
"what is selected + its editable props" to drive the inspector (no x/top/bottom).

### 4. Resize demoted into Export

Drop the `resize` tab. Export becomes a small popover/dialog (format PNG/JPEG +
W/H inputs with aspect lock), reusing the existing `resize`+`exportAs` logic.
Remove the top-bar `→ W × H` badge.

### 5. Top bar slimmed

Keep dims + zoom + undo/redo/reset. Remove the orphan Delete button (object
delete now lives only in the inspector + Delete/Backspace key).

### 6. Background as a layer entry

The static "Background" row becomes clickable: it `discardActiveObject()` so the
inspector shows the Canvas (adjust/filters) section. Background stays
`canvas.backgroundImage` (not a real fabric object) — no engine change.

## Risks

- **New pointer-create code** is the main new surface; must not regress pan /
  mosaic / object-drag (all share `mouse:*`). Mitigate by strict tool gating and
  reusing `getScenePoint`.
- **Large JSX rewrite** of the right panel; the canvas/history/crop/mosaic/zoom
  engine is deliberately untouched to bound the regression area.
- Arrow-by-drag needs angle math for the head; if it proves fiddly, fall back to
  click-to-insert a default arrow (noted, not preferred).

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, regenerated
`public/r/image-editor.json` (`pnpm registry:build`). Possibly no new deps
(alert-dialog already added for reset; export popover can reuse it or a simple
inline panel). Out: per-object filters / adjustment layers / command palette
(Alt-3, rejected as over-scoped for a demo block); no engine/history format
change.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0
  (prerenders `/blocks/view/image-editor`).
- Manual click-through: each tool arms its pointer mode; drag-create rect/
  ellipse/arrow at the pointer; click-create + edit text; inspector swaps
  object ⇄ canvas; adjust/filters on canvas section; redact paints; crop apply/
  cancel; export popover sets size; undo/redo/reset; tool hotkeys.

## Alternatives

See [P-021](./P-021-add-image-editor.md) review thread: Alt-1 (minimal: keep
tabs, only de-dup + demote resize) and Alt-3 (max: per-object filters, command
palette) — Alt-2 chosen.

## Outcome

Implemented in `registry/ikui/blocks/image-editor.tsx`:
- **Tools, not tabs.** `tool` state + `TOOLS` rail (Select / Text / Shape / Draw
  / Redact / Crop / Hand) with hotkeys V T R P M C H. `activateTool()` is the one
  place that tears down (pen / mosaic / crop) and arms (pointer mode + cursor +
  `selection` / `skipTargetFind`) each tool; live mirrors `toolRef` / `colorRef`
  / `shapeKindRef` let the mount-bound handlers read current values, and
  `activateToolRef` lets a handler return to Select after a create.
- **Direct-manipulation insertion.** New `mouse:down/move/up` handlers: Text drops
  an editing `IText` at the click; Shape drags rect / ellipse / arrow to size
  (tiny click → default size). `creatingRef` suppresses intermediate history so a
  create commits one frame on up.
- **Contextual inspector.** Right panel top = Object section (color / font /
  stroke / opacity / z-order / duplicate / delete — the former floating toolbar,
  now a single home) when an object is selected, else the Canvas section
  (filters strip + B/C/S + rotate / flip). The floating toolbar and its
  positioning math were removed; `sel` no longer carries x/top/bottom.
- **Resize → Export popover.** Resize tab dropped; output W/H + aspect lock live
  in an Export `Popover` (PNG / JPEG). Top-bar `→ W × H` badge and orphan Delete
  button removed.
- **Background layer row** is now a button: clears the selection and drops into
  Select so the Canvas section shows. Image overlay moved to a footer button.
- Registry dep `popover` added.

Verify: `pnpm biome check` clean; `pnpm registry:build` regenerated
`public/r/image-editor.json` (registry-deps now include `popover`); `pnpm build`
exit 0 (prerenders `/blocks/view/image-editor`). Interactive click-through
(drag-create shapes, place/edit text, inspector swap, redact, crop, export
popover, tool hotkeys) recommended — not verifiable headlessly.

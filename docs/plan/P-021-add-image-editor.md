# P-021 — image-editor block (canonical)

Status: completed (as-built)
Task: T-021

> Single source of truth for the `image-editor` registry block. Consolidates the
> original build and every follow-up refinement (T-022…T-039 — see
> [History](#history)). The earlier per-phase plan files (P-032…P-039) were
> folded into this document and removed.

## Goal

Ship an `image-editor` registry **block** — a full single-image editor built on
**fabric.js** wrapped in ikui's Base UI chrome. Deliver the
Filerobot-Image-Editor (FIE) feature set without FIE's React-17/18 + konva +
styled-components coupling, while keeping the block copy-paste friendly.

## Why fabric.js

- `react-filerobot-image-editor` rejected: peer-deps React 17/18 (ikui is React
  19 + Next 16 RSC), pulls `react-konva` + `styled-components` (ikui is Tailwind 4
  + Base UI, no CSS-in-JS), ships as a monolithic package — breaks copy-paste.
- **fabric `^7.4.0`, MIT, zero runtime deps**, ships its own TS types,
  framework-agnostic. Used vanilla: a `'use client'` component attaches a
  `fabric.Canvas` to a `<canvas>` ref inside an effect (never during render), so
  Next 16 RSC / static export is unaffected. Same "block declares a heavy
  external dep" pattern as `mediabunny` / `recharts`; `fabric` is declared in the
  block's `dependencies`.
- `pnpm-workspace.yaml` sets `allowBuilds.canvas: false` — fabric's optional
  node-canvas native build is unused in the browser and otherwise blocks
  `pnpm install`.

## Architecture

`registry/ikui/blocks/image-editor.tsx` — one `'use client'` component owning a
single `fabric.Canvas` over a base image. fabric provides the object engine
(selection, transform handles, z-order, hit-testing); ikui provides the chrome.

- **Public API** (stable — the `blocks/view/[name]` consumer depends on it):
  `ImageEditorProps { imageUrl?: string; onExport?: (file: File) => void }` +
  default export. Source image: `imageUrl` prop or the bundled sample; `Load`
  replaces it from an upload.
- **Lifecycle**: lazy `import('fabric')` in a mount effect, `canvas.dispose()` on
  unmount, object-URL cleanup. Strict-Mode double-init guarded via a `cancelled`
  flag.
- **State model**: active `tool`, `shapeKind`, tonal `Adjust`
  (brightness/contrast/saturation, fabric's −1..1 range), filter `preset`,
  `color`, draw/mosaic brush params, `zoom` / `fitScale` / `dims`, `resize`
  target, crop overlay state, `sel` (selected-object props for the inspector).
  Canvas-side pointer/brush handlers bind once at mount and read live values
  through refs (`toolRef`, `colorRef`, `shapeKindRef`, `mosaicRef`, `panRef`,
  `activateToolRef`, `creatingRef`).

### Layout

`Card` (`w-full`, no max width) → `CardContent` row: a left vertical **tool rail**
(`ToggleGroup`) → top bar (dims + zoom on the left, undo/redo/reset on the right)
over a horizontal **`ResizablePanelGroup`** — the **canvas** panel on the left, a
**right work area** on the right that is itself a vertical resizable split: the
contextual **inspector** on top, a **Layers** panel below. `CardFooter`: Load /
Image / Export.

### Tools (pointer modes)

The left rail selects one tool; `activateTool()` is the single place that tears
down the tool being left (pen / mosaic / crop) and arms the one being entered
(pointer behaviour + cursor + `selection` / `skipTargetFind`). Hotkeys
`V T R P M C H` (suppressed while typing / editing text).

- **Select (V)** — move / scale / rotate, rubber-band, click / double-click.
- **Text (T)** — click on the canvas to drop an editing `IText` at the pointer.
- **Shape (R)** — `shapeKind` rect / ellipse / arrow; **drag on the canvas** to
  size at the pointer (tiny click → default size). Arrow = `Line` + `Triangle`
  head grouped. A create commits one history frame on `mouse:up`.
- **Draw (P)** — `PencilBrush`; colour + size.
- **Redact (M)** — the **Mosaic** brush: reveals a pixelated copy of the
  background through a round brush onto a live offscreen layer; `pixSrc` samples
  original pixels per stroke so it never re-pixelates. One drag = one history
  frame. Size + Block sliders.
- **Crop (C)** — reuses the ikui `image-crop` primitive: snapshot the canvas to
  an `<img>`, overlay `ImageCrop` with aspect presets (Free / 1:1 / 16:9 / 9:16 /
  4:3 / 3:4); Apply re-frames the canvas (shift bg + every object by the crop
  origin, `setDimensions`) → returns to Select. Rotate / flip live in the Canvas
  inspector section (they act on the whole image).
- **Hand (H)** — drag-to-pan when zoomed in.

Watermark text and image overlay are one-click inserts (Text tool option /
footer **Image** button).

### Contextual inspector

The right-area top panel built on the `Field` component:

- **Object selected** → object properties: colour, font family (`Select`) / size
  / bold / italic / align (text), stroke width (shape), opacity. Duplicate /
  reorder / delete live on the layer row, not here.
- **Nothing selected** (Select / Hand) → **whole-image** section: filter preset
  strip (wraps to fill width), brightness / contrast / saturation sliders, and
  rotate-left / rotate-right / flip-H / flip-V.
- **Tool options** (shape kind, pen size, mosaic size/block, crop aspect +
  Apply/Cancel) render above the context section.

### Layers panel

Lists `canvas.getObjects()` top-first; rebuilt on object + selection changes and
after history loads (transient `WeakMap` ids). Row = visibility eye (leftmost),
drag handle, type icon, name, `···` menu. `@dnd-kit` reorder maps the displayed
index to `canvas.moveObjectTo`.

- **Rename**: double-click the name (or `···` → Rename) edits inline. The name is
  stored on `obj.layerName`, registered via
  `fabric.FabricObject.customProperties = ['layerName']` so `toObject` serializes
  it and `loadFromJSON` restores it — names survive undo/redo. Empty reverts to
  the type label.
- **`···` menu**: Rename / Duplicate / Bring forward / Send back / Delete.

### Cross-cutting

- **Zoom / pan** (filerobot-aligned): zoom via `canvas.viewportTransform`
  (`zoomToPoint`, 1×…8×), `clampViewport` keeps the image filling the frame.
  Drag-to-pan on empty canvas when zoomed, the Hand tool, or hold **Space**;
  wheel zooms toward the pointer. Percent readout = `round(fitScale * zoom * 100)`.
- **Selection styling**: `InteractiveFabricObject.ownDefaults` set to teal border
  + round white-bordered handles, matching the `image-crop` primitive.
- **History**: stack of `canvas.toJSON()` snapshots + cursor; undo / redo / reset
  (to frame 0). Each snapshot also stores canvas pixel size + derived
  `dims`/`fitScale` (`toJSON` omits them), so a cropped/rotated frame round-trips
  with objects aligned. A `restoring` flag suppresses the change listener during
  a reload; mosaic refs are nulled so the next stroke rebuilds a fresh layer.
- **Export**: an **Export** popover holds output W/H (aspect lock) + PNG / JPEG.
  Render the whole canvas at source resolution (`multiplier = dims.w/canvas.width`,
  viewport reset to identity), scale to the chosen size via an offscreen canvas →
  download + `onExport?(file)`.

## Registry wiring

`registry:block`, `category: blocks`, `categories: ['image']`. Deps `fabric`,
`lucide-react`, `@dnd-kit/{core,sortable,utilities}`; registry-deps
`@ikui/image-crop`, `alert-dialog`, `button`, `card`, `dropdown-menu`, `field`,
`popover`, `resizable`, `select`, `slider`, `toggle-group`.
`public/r/image-editor.json` generated via `pnpm registry:build`; `BLOCK_ORDER`
places it after `image-cropper`. Blocks have no `docs/<name>/` page — they surface
via the `/blocks` gallery and the `blocks/view/[name]` route that dynamic-imports
the default export.

## History

Folded-in tasks (superseded; code already reflected above):

- **T-021** — initial fabric.js editor: annotate / draw / mosaic / adjust /
  filters / transform / history / export; left-rail layout.
- **T-022** — fixed mosaic offset (fabric v7 center-origin default); one mosaic
  drag = one undo; collapsed mosaic refs.
- **T-023** — top bar: dimensions + zoom readout; reset/undo/redo.
- **T-024** — viewportTransform zoom + drag/Space pan.
- **T-025** — Filters as a live thumbnail strip; data-driven presets.
- **T-026** — Watermark, Crop (hand-built rect), Resize; full-res export.
- **T-027** — Crop reuses the `image-crop` primitive (aspect presets).
- **T-028** — unified teal selection styling; text watermark.
- **T-029** — merged Draw + Mosaic into one tab (mode switch).
- **T-030** — left rail switched from Tabs to ToggleGroup.
- **T-031** — right-side controls to ToggleGroup; live color fix.
- **T-032** — correctness: crop in history, keyboard Delete/Backspace + Cmd/Ctrl+Z
  / Shift+Z / Ctrl+Y, reset icon + confirm dialog.
- **T-033** — IA regroup 8 tools → grouped tabs; options bar above the canvas.
- **T-034** — floating selection toolbar; editable stroke width; colour↔selection
  sync; export-size badge.
- **T-035** — right work area: resizable options + Layers panel with dnd reorder.
- **T-036** — **breaking redesign**: tabs → tool-driven canvas; direct-manipulation
  insertion; contextual inspector (replaces the floating toolbar + options bar);
  Resize folded into an Export popover.
- **T-037** — `Select` component for fonts; object actions moved into the layer
  row `···` menu.
- **T-038** — rename layers (`layerName` via `customProperties`, persisted through
  `toJSON`/history).
- **T-039** — inspector rows use the `Field` component.
- Polish — removed the Card max width; filter strip wraps; removed the synthetic
  "Background" layer row (the whole-image section shows whenever nothing is
  selected); eye toggle moved to the row's left edge.

## Verify (as-built)

- `pnpm biome check` clean (the block is NOT biome-excluded);
  `pnpm registry:build` regenerates `public/r/image-editor.json`; `pnpm build`
  exit 0 (prerenders `/blocks/view/image-editor` — confirms the lazy-fabric
  pattern is SSR-safe).
- Interactive fabric behavior (draw / shapes / mosaic / crop / rename / export
  pixels) is not verified headlessly; a manual browser click-through is
  recommended.

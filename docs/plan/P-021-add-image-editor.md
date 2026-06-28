# P-021 — image-editor block (canonical)

Status: completed (as-built) · Next section open
Task: T-021

> Canonical reference for the `image-editor` registry block. Consolidates the
> original build (T-021) and ten follow-up refinements (T-022…T-031, now
> superseded — see [History](#history)). This is the single source of truth for
> the block's design; future work is tracked under [Next](#next).

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
- **State model**: tonal `Adjust` (brightness/contrast/saturation, fabric's
  −1..1 range), filter `preset`, `color`, draw/mosaic brush params, `zoom` /
  `fitScale` / `dims`, `resize` target, crop overlay state. Canvas-side
  pointer/brush handlers read live values through refs (`mosaicRef`, `panRef`)
  since they bind once at mount.

### Tools (as-built)

Left vertical **ToggleGroup** rail selects one of **five groups** (P-033, with
Resize later split back out of Geometry). Layout (P-035): a top bar over a
horizontal **`ResizablePanelGroup`** — the **canvas** panel on the left, a
**right work area** on the right that is itself a vertical resizable split:
the active group's **options** on top, a **Layers** panel below.

- **Annotate** — `IText` (in-place edit), watermark text, `Rect`, `Ellipse`,
  arrow (`Line` + `Triangle` head grouped), image overlay, and **Pen**
  (`PencilBrush`, a toggle — any object add exits it); delete + z-order
  (bring-forward / send-back). Color picker recolors the pen brush and the
  selected object live (text → `fill`, shape → `stroke`).
- **Redact** — the **Mosaic** brush (its own tool; on while the tab is active).
  Reveals a pixelated copy of the background through a round brush onto a live
  offscreen layer; `pixSrc` samples original pixels per stroke so it never
  re-pixelates. One drag = one history frame (committed on `mouse:up`). Size +
  Block sliders.
- **Adjust** — the filter thumbnail strip **and** brightness / contrast /
  saturation sliders in one panel. Nine preset stacks (Original, Invert, B&W,
  Sepia, Vivid, Clarendon, Gingham, Cool, Warm) as a horizontal strip of live
  160×120 preview thumbnails; presets compose with the sliders, applied live via
  `img.filters = [...]; img.applyFilters()`.
- **Geometry** — **Crop** (explicit button → reuses the ikui `image-crop`
  primitive: snapshot the canvas to an `<img>`, overlay `ImageCrop` with aspect
  presets Free / 1:1 / 16:9 / 9:16 / 4:3 / 3:4; Apply re-frames the canvas — shift
  bg + every object by the crop origin, `setDimensions` to the crop size — or
  Cancel), **rotate** 90° cw/ccw (baked by redrawing the base element), and
  **flip** H/V.
- **Resize** — W/H number inputs with aspect lock; applied on export (its own
  rail group). The top bar shows a `→ W × H` badge when the target differs from
  the current dims.

### Cross-cutting

- **Zoom / pan** (filerobot-aligned): zoom via `canvas.viewportTransform`
  (`zoomToPoint`, 1×…8×), `clampViewport` keeps the image filling the frame.
  Drag-to-pan on empty canvas when zoomed, or hold **Space** in any tool; wheel
  zooms toward the pointer. Percent readout = `round(fitScale * zoom * 100)`.
- **Selection styling**: `InteractiveFabricObject.ownDefaults` set to teal
  border + round white-bordered handles, matching the `image-crop` primitive.
- **Floating selection toolbar** (P-034): anchored to the active object; follows
  move/scale/rotate and reflows on zoom. Type-aware controls (filerobot-style):
  text → colour / font family / size / bold / italic / align; shape → colour /
  stroke width; all → opacity, then duplicate / z-order / delete.
- **Layers panel** (P-035): right-area bottom split; lists objects top-first with
  drag-to-reorder (`@dnd-kit`, mapped to `canvas.moveObjectTo`), per-row select /
  visibility / delete; rebuilt on object + selection changes and after history
  loads. Deps: `@dnd-kit/{core,sortable,utilities}`, registry-dep `resizable`.
- **History**: stack of `canvas.toJSON()` snapshots + cursor; undo / redo /
  reset (to frame 0). `restoring` flag suppresses the change listener during a
  reload; mosaic refs are nulled so the next stroke rebuilds a fresh layer.
- **Export**: render the whole canvas at source resolution
  (`multiplier = dims.w / canvas.width`, viewport reset to identity), then scale
  to the Resize target via an offscreen canvas → PNG / JPEG download +
  `onExport?(file)`.

## Registry wiring

`registry:block`, `category: blocks`, `categories: ['image']`. Deps `fabric`,
`lucide-react`; registry-deps `button`, `card`, `slider`, `toggle-group`,
`@ikui/image-crop`. `public/r/image-editor.json` generated via
`pnpm registry:build`; `BLOCK_ORDER` places it after `image-cropper`. Blocks have
no `docs/<name>/` page — they surface via the `/blocks` gallery and the
`blocks/view/[name]` route that dynamic-imports the default export.

## Known issues

1. ~~**Reset/undo after crop misaligns.**~~ Fixed in [P-032](./P-032-image-editor-correctness-fixes.md):
   history now captures canvas dimensions + `dims`/`fitScale`.
2. ~~**No keyboard delete.**~~ Fixed in [P-032](./P-032-image-editor-correctness-fixes.md):
   Delete/Backspace + Cmd/Ctrl+Z / Shift+Z / Ctrl+Y.
3. ~~**Resize is export-only / non-WYSIWYG.**~~ Mitigated in
   [P-034](./P-034-image-editor-object-affordances.md): still export-only by
   design, but the top bar now shows an explicit `→ W × H` badge.
4. ~~**Reset icon collides** with Transform "rotate left".~~ Fixed in
   [P-032](./P-032-image-editor-correctness-fixes.md): reset now uses `History` +
   a confirm.
5. ~~**Color picker not synced to selection.**~~ Fixed in
   [P-034](./P-034-image-editor-object-affordances.md): selecting an object
   mirrors its colour into the picker.
6. ~~**Mosaic semantics.** It lives under "Draw" with an `Eraser` icon.~~ Fixed
   in [P-033](./P-033-image-editor-ia-regroup.md): now its own **Redact** tool
   with a `Grid3x3` icon.

## Next

A breaking interaction redesign; staged so each phase ships independently. Each
phase is split into its own plan (P-032…) when picked up — this section is the
agreed direction.

- **Phase 1 — correctness (no IA change).** ✅ Done —
  [P-032](./P-032-image-editor-correctness-fixes.md). Fixed Known issues #1 (crop
  in history), #2 (keyboard Delete/Backspace + Cmd/Ctrl+Z / Shift+Z), #4 (reset
  icon + confirm).
- **Phase 2 — IA: 8 tools → 4 groups.** ✅ Done —
  [P-033](./P-033-image-editor-ia-regroup.md). Annotate (text / shapes / arrow /
  Pen / image / watermark) · Redact (mosaic) · Adjust (filters + B/C/S) ·
  Geometry (crop / rotate / flip / resize); options bar moved above the canvas,
  `order` flip removed.
- **Phase 3 — object affordances.** ✅ Done —
  [P-034](./P-034-image-editor-object-affordances.md). Floating selection toolbar
  (colour, stroke width, z-order, duplicate, delete) anchored to the object;
  editable stroke width; colour picker synced to selection (#5); explicit
  `→ W × H` export badge (#3).

Positioning: a **demo block first**, but interaction polished to product
standard (the registry's value is "copy it and ship it").

## History

Folded-in tasks (superseded; code already in the as-built block above):

- **T-021** — initial fabric.js editor: annotate / draw / mosaic / adjust /
  filters / transform / history / export; left-rail layout.
- **T-022** — fixed mosaic offset (fabric v7 center-origin default); removed
  debug code; one mosaic drag = one undo; collapsed mosaic refs.
- **T-023** — top bar: dimensions + zoom readout; reset/undo/redo/delete.
- **T-024** — viewportTransform zoom + drag/Space pan (filerobot alignment).
- **T-025** — Filters as a live thumbnail strip; data-driven presets.
- **T-026** — Watermark, Crop (hand-built rect), Resize tools; full-res export.
- **T-027** — Crop reuses the `image-crop` primitive (aspect presets).
- **T-028** — unified teal selection styling; text watermark.
- **T-029** — merged Draw + Mosaic into one tab (mode switch).
- **T-030** — left rail switched from Tabs to ToggleGroup.
- **T-031** — right-side controls to ToggleGroup; live color fix.

## Verify (as-built)

- `pnpm biome check` clean (the block is NOT biome-excluded);
  `pnpm registry:build` regenerates `public/r/image-editor.json`; `pnpm build`
  exit 0 (prerenders `/blocks/view/image-editor` — confirms the lazy-fabric
  pattern is SSR-safe).
- Interactive fabric behavior (draw/mosaic/crop/export pixels) is not verified
  headlessly; a manual browser click-through is recommended.

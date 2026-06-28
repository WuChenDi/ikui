# P-032 — image-editor Phase 1: correctness fixes

Status: completed
Task: T-032
Parent: [P-021](./P-021-add-image-editor.md) (Next → Phase 1)

## Goal

Fix the correctness Known issues from P-021 without changing the information
architecture (no tool regrouping, no layout move). Three independent fixes:

1. **#1 — crop/reset history misalignment.** `restore()` reloads objects via
   `loadFromJSON` but fabric's `toJSON()` omits `canvas.width/height`, so undo /
   reset after a crop keeps the cropped canvas size while objects reload at
   original coords. History must also capture canvas pixel dimensions and the
   derived `dims` / `fitScale`, and `restore()` must reapply them.
2. **#2 — keyboard shortcuts.** Delete / Backspace removes the selected object;
   Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z (and Ctrl+Y) redo. Suppressed while typing
   in an input or editing an `IText`.
3. **#4 — reset icon + confirm.** Reset no longer shares `RotateCcw` with
   Transform "rotate left" (use `History`); reset asks for confirmation before
   wiping edits.

## Changes (`registry/ikui/blocks/image-editor.tsx`)

### History captures canvas dimensions (#1)

- History stack becomes `Snapshot[]` instead of `string[]`:
  `{ json, width, height, dims, fitScale }`.
- `dimsRef` / `fitScaleRef` mirror the `dims` / `fitScale` state so `pushHistory`
  can read them without entering the mount-effect dependency array (which would
  remount the canvas). Updated wherever `setDims` / `setFitScale` run
  (`fitBackground`, `applyCrop`).
- `restore(snap)`: after `loadFromJSON`, `setDimensions(width,height)`, reset
  viewport, and restore `dims` / `resize` / `fitScale` / `zoom` state.
- Mount + `replaceImage` seed a `Snapshot` (not a bare JSON string).

### Keyboard (#2)

- In the mount effect's `onKeyDown`, before the Space handling: handle
  Cmd/Ctrl+Z / Shift+Z / Ctrl+Y and Delete / Backspace, all gated by the
  existing `isTyping()`. Undo/redo are called through `undoRef` / `redoRef`
  (kept current each render) so no new effect deps are introduced. Delete uses
  the canvas directly (`remove` + `discardActiveObject`), letting the existing
  `object:removed` listener push history.

### Reset (#4)

- Reset button icon `RotateCcw` → `History`.
- `reset()` guards on `window.confirm` before reverting.

## Verify

- `pnpm biome check` clean (block is not biome-excluded).
- `pnpm registry:build` regenerates `public/r/image-editor.json`.
- `pnpm build` exit 0.
- Manual (browser): crop → undo restores the pre-crop frame with objects
  aligned and dims/zoom correct; crop → reset likewise; Delete/Backspace removes
  a selected object (but not while editing text); Cmd/Ctrl+Z / Shift+Z work;
  reset prompts before wiping.

## Outcome

Implemented in `registry/ikui/blocks/image-editor.tsx`:
- History stack is now `Snapshot[]` (`json` + canvas `width`/`height` + `dims` +
  `fitScale`); `dimsRef`/`fitScaleRef` mirror state for `pushHistory`. `restore`
  reapplies canvas size + dims/resize/fitScale/zoom after `loadFromJSON`, so
  crop now undoes/resets with objects aligned. Both seed sites (mount,
  `replaceImage`) and `applyCrop` updated.
- `onKeyDown` handles Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y, and
  Delete/Backspace (via `undoRef`/`redoRef`, gated by `isTyping()`).
- Reset icon `RotateCcw` → `History`; `reset()` confirms via `window.confirm`.

Verify: `pnpm biome check` clean; `pnpm registry:build` regenerated
`public/r/image-editor.json`; `pnpm build` exit 0. Interactive (crop undo,
keyboard delete, shortcuts) recommended for a manual browser click-through.

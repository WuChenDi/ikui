# P-038 — image-editor: rename layers

Status: completed
Task: T-038
Parent: [P-036](./P-036-image-editor-tool-driven-redesign.md)

## Goal

Let the user name each layer in the right-side Layers panel. The custom name
must survive undo / redo (the history stores `canvas.toJSON()` snapshots).

## Changes (`registry/ikui/blocks/image-editor.tsx`)

- Persist the name on the fabric object as `layerName`, registered via
  `fabric.FabricObject.customProperties = ['layerName']` at mount so
  `canvas.toJSON()` serializes it and `loadFromJSON` restores it (round-trips
  through history). Confirmed in fabric 7.4.0:
  `propertiesToSerialize = […].concat(FabricObject.customProperties, …)`.
- `Layer` gains `name?: string`; `rebuildLayers` reads `obj.layerName` →
  `label = layerName || typeLabel`.
- `LayerRow`: double-click the label (or a **Rename** item in the `···` menu)
  edits it inline; Enter / blur commits, Escape cancels. New `onRename(name)`
  prop → `renameLayer(obj, name)` sets `layerName` (empty reverts to the type
  label), rebuilds, and commits one history frame.

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, regenerated
`public/r/image-editor.json`. Out: no new deps; no rename for the Background row.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.
- Manual: double-click a layer label → input → type → Enter renames; ··· →
  Rename works; undo/redo preserves names.

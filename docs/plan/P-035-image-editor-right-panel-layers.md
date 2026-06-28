# P-035 — image-editor: right panel (options + layers) with resizable + dnd layers

Status: completed
Task: T-035
Parent: [P-021](./P-021-add-image-editor.md)

## Goal

Add a right-side work area split into two resizable sections: **top = the active
tool's options bar** (moved out from above the canvas), **bottom = a Layers
panel** listing the canvas objects with drag-to-reorder (z-order).

## Layout

- `CardContent` row: left tool rail → `ResizablePanelGroup` (horizontal):
  - **Canvas panel** (top bar + stage).
  - **Right panel** = `ResizablePanelGroup` (vertical): **Options** panel (the
    `{tab === …}` controls, scrollable) over **Layers** panel.
- Built on the existing `resizable` component (react-resizable-panels). Card
  widened to `max-w-5xl` for the third zone.

## Layers panel (dnd-kit)

- Lists `canvas.getObjects()` top-first. Row = drag handle + type icon + label +
  visibility toggle + delete; clicking the row selects the object (active row
  highlighted). A static muted "Background" row anchors the bottom.
- Reorder via `@dnd-kit/core` + `@dnd-kit/sortable`
  (`verticalListSortingStrategy`); `onDragEnd` maps the displayed (top-first)
  index to a fabric bottom index and calls `canvas.moveObjectTo`, then commits
  history.
- Stable per-object ids via a `WeakMap` (transient; rebuilt after history loads).
- `rebuildLayers()` wired to `object:added/removed/modified`, selection events,
  and after `restore` / visibility / reorder.

## Deps

- npm: `@dnd-kit/core` ^6.3.1, `@dnd-kit/sortable` ^10.0.0, `@dnd-kit/utilities`
  ^3.2.2 (added to `package.json` and the block's registry `dependencies`).
- registry: `resizable` added to `registryDependencies`.

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, `registry.json`, regenerated
`public/r/image-editor.json`, `package.json`. Out: layer rename, grouping,
nested layers, opacity per layer (already on the floating toolbar).

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.
- Manual: drag the vertical/horizontal handles to resize; options follow the
  selected tool; layers list reflects objects; drag a layer to reorder (canvas
  z-order updates); eye toggles visibility; trash deletes; selecting a row
  selects on canvas; undo/redo rebuilds the list.

## Outcome

Implemented in `registry/ikui/blocks/image-editor.tsx`:
- Layout: left rail → horizontal `ResizablePanelGroup` (canvas | right). Right =
  vertical group: Options panel (the relocated `{tab === …}` controls, scrollable)
  over Layers panel. Card widened to `max-w-5xl`; canvas stage now `h-full`
  inside its panel.
- Note: this project's `resizable` is react-resizable-panels v4 — props are
  `orientation` (not `direction`) and percentage-string sizes (`"62%"`).
- Layers: module-scope `LayerRow` (`useSortable`) + `layerMeta`; `rebuildLayers`
  (wired to object add/remove + selection, and after `restore`) builds a
  top-first list with transient `WeakMap` ids. Drag reorder via `DndContext` +
  `SortableContext` → `canvas.moveObjectTo`; eye toggles `visible`; trash
  removes; row click selects. Static "Background" row anchors the bottom.

Verify: `pnpm biome check` clean; `pnpm registry:build` regenerated
`public/r/image-editor.json` (deps now include `@dnd-kit/*`, registry-deps
`resizable`); `pnpm build` exit 0 (prerenders the block). Interactive
click-through recommended (resize handles, layer drag/visibility/select).

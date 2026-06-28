# P-039 — image-editor: use the Field component for inspector rows

Status: completed
Task: T-039
Parent: [P-036](./P-036-image-editor-tool-driven-redesign.md)

## Goal

Replace the hand-built `span` label + control rows in the right inspector with
the project's `Field` component (`FieldSet` / `FieldLegend` / `Field` /
`FieldLabel` / `FieldDescription`) for consistent typography and proper label
semantics.

## Changes (`registry/ikui/blocks/image-editor.tsx`)

- `objectSection`: `FieldSet` + `FieldLegend` (Text/Shape/Object) wrapping
  horizontal `Field`s — Color, Font, Size, Stroke, Opacity. The `···`-menu hint
  becomes a `FieldDescription`.
- `canvasSection`: `FieldSet` + `FieldLegend` "Whole image"; brightness /
  contrast / saturation become horizontal `Field`s. Filters strip + transform
  buttons stay as plain blocks (not label/control pairs).
- `toolOptions` (draw / redact): the slider rows become horizontal `Field`s.
- Sliders / Select inside a horizontal Field get a fixed control width (the
  field-label takes the remaining space), so the control doesn't collapse.
- Keep the bordered `colorPicker` chip (already a semantic `<label>`).
- Registry dep `field` added (pulls `label` + `separator`).

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, `registry.json`, regenerated
`public/r/image-editor.json`. Out: behaviour changes — purely presentational.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.

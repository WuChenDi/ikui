# P-037 — image-editor: Select component for fonts + layer-row action menu

Status: completed
Task: T-037
Parent: [P-036](./P-036-image-editor-tool-driven-redesign.md)

## Goal

Two follow-up refinements on the P-036 redesign:

1. Replace the native `<select>` (font family, in the inspector Object section)
   with the project's Base UI `Select` component for consistent styling.
2. Move object operations (Duplicate / Bring forward / Send back / Delete) out of
   the inspector and into each **Layers** row, behind a `···` (more) dropdown
   menu — so layer operations live with the layers.

## Changes (`registry/ikui/blocks/image-editor.tsx`)

- Font: `Select` + `SelectTrigger` / `SelectValue` / `SelectContent` /
  `SelectItem` driven by `sel.fontFamily` → `changeFontFamily`.
- `LayerRow` gains a `···` `DropdownMenu` with Duplicate / Bring forward / Send
  back / Delete (delete moves into the menu; the eye visibility toggle stays
  inline). New row props `onDuplicate` / `onForward` / `onBack`.
- New object-by-reference helpers `duplicateLayer(obj)` / `moveLayer(obj, dir)`;
  remove the now-unused active-object helpers `duplicateActive` / `order` /
  `deleteActive` and the inspector's object-action button row.
- Registry deps: add `select`, `dropdown-menu`.

## Scope

In: `registry/ikui/blocks/image-editor.tsx`, `registry.json`, regenerated
`public/r/image-editor.json`. Out: layer rename / grouping.

## Verify

- `pnpm biome check` clean; `pnpm registry:build`; `pnpm build` exit 0.
- Manual: font dropdown styled like other Selects; each layer row's `···` opens
  Duplicate / forward / back / Delete and acts on that row's object.

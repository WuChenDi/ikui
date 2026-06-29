# P-023 — Add tree component (data-driven, self-contained)

Status: completed
Task: T-041

## Goal

Add a `tree` registry component: a data-driven hierarchical tree view (folders /
leaves) with selection, expand/collapse, per-node icons, an actions slot, and a
custom `renderItem`. Lives in the `display` category.

## Current state

- Two references were reviewed:
  - `tmp/reui/.../base/reui/tree.tsx` — a *headless* primitive over
    `@headless-tree/core` (needs a `tree` instance, coupled to reui's
    `IconPlaceholder` multi-icon system and `style-*` variants). Wrong shape for
    ikui: extra runtime dep + reui-only abstractions.
  - `mg-ikkyu-web/src/components/tree-view.tsx` — a self-contained, data-driven
    `TreeView` (good API: `data`, selection, icons, actions, `renderItem`,
    chevron position, drag-drop) but built on **Radix Accordion**, which ikui
    forbids ("Base UI only, no Radix").
- ikui registry components are closed, copy-pasteable, lucide + `cn()` based.
  None import `@base-ui/react` directly; expand/collapse primitives
  (`accordion` / `collapsible`) are **not** wrapped in `src/components/ui`.
- `display` category already exists in `src/lib/doc.ts` (chart, spark-chart,
  qr-code, heatmap-calendar) — no doc.ts change.

## Proposal

Port the **mg `TreeView` API** to ikui conventions, dropping Radix entirely.
`registry/ikui/tree.tsx` (`registry:component`, `category: display`):

- `TreeDataItem` data model: `{ id, name, icon?, selectedIcon?, openIcon?,
  children?, actions?, onClick?, disabled?, className? }`.
- `Tree({ data, initialSelectedItemId, onSelectChange, expandAll,
  chevronPosition='left', defaultNodeIcon, defaultLeafIcon, renderItem,
  className })`.
- Selection: uncontrolled `initialSelectedItemId` + `onSelectChange(item)`.
- Expand/collapse: **self-managed**, no Accordion primitive. Local `Set<string>`
  of expanded ids; `initialSelectedItemId` auto-expands ancestors; `expandAll`
  expands everything. Folder children animate open via the pure-Tailwind
  `grid-rows-[0fr]→[1fr]` transition (no keyframes config, no `motion` dep).
- Icons: `selectedIcon` > `openIcon` > `icon` > `defaultNode/LeafIcon`, same
  precedence as the reference.
- `actions` slot (hover/selected-revealed) and `renderItem` custom renderer kept.
- lucide `ChevronRight` for the toggle; `cn()` from `@/lib/utils`.

**Dropped from the reference (Simplicity First — out unless requested):**
drag-and-drop (`draggable`/`droppable`/`onDocumentDrag`). It is ~40% of the mg
file and not part of "make a tree". Flagged as an optional follow-up.

Supporting changes (mirrors P-016 / P-022):

- `registry.json` item: `dependencies: ["lucide-react"]`,
  `registryDependencies: []`, `category: "display"`.
- `tsconfig.json`: `@/components/tree` → `registry/ikui/tree.tsx`.
- Docs `docs/tree/`: hero `demo.tsx` (folders + files), plus `demo-icons.tsx`
  (custom node/leaf icons), `demo-selected.tsx` (`initialSelectedItemId` +
  `onSelectChange`), `demo-actions.tsx` (per-row action button). `doc.mdx`:
  Hero → Installation → Usage → Examples → Props (`Tree` + `TreeDataItem`).

## Risks

- Self-managed expand state replaces Radix's animation. The `grid-rows` trick is
  robust but must guard `overflow-hidden` on the animating wrapper.
- `renderItem` signature must match the reference (`{ item, level, isLeaf,
  isSelected, isOpen, hasChildren }`) so the demo and docs stay truthful.
- No new UI primitive is added; if a reviewer prefers a `collapsible` ui wrapper,
  that is a larger, separate change — call out, don't pre-build.

## Scope

In: `registry/ikui/tree.tsx`, its `registry.json` entry, `tsconfig.json` alias,
`docs/tree/` (demos + doc.mdx), `pnpm registry:build`.
Out: drag-and-drop, virtualization, multi-select, a `collapsible` ui primitive,
any change to other components or `src/lib/doc.ts`.

## Steps

1. Write `registry/ikui/tree.tsx`. verify: typechecks; imports resolve.
2. `registry.json` item + `tsconfig.json` alias.
   verify: `pnpm registry:build` emits `public/r/tree.json` with deps.
3. `docs/tree/` demos + `doc.mdx`.
   verify: doc route renders; sidebar shows "Display › Tree".
4. `pnpm lint` (scoped). verify: green; expand/collapse, select, actions work.

## Result

- `registry/ikui/tree.tsx` — self-contained `Tree` (recursive `TreeNode`), no
  Radix / no `@base-ui` / no `@headless-tree`. Self-managed expand state: a
  per-node `useState` seeded from `collectExpandedIds()` (ancestors of
  `initialSelectedItemId`, or all when `expandAll`); animated open/close via the
  pure-Tailwind `grid-rows-[0fr]↔[1fr]` trick. Icon precedence
  selected > open > own > `defaultNode/Leaf`. `actions` slot
  (hover/selected-revealed, click does not select/toggle), `renderItem`, and
  `chevronPosition` kept from the mg reference. Drag-and-drop intentionally out.
- `registry.json` + `public/r/tree.json` (via `pnpm registry:build`):
  `registry:component`, `category: display`, deps `lucide-react`, no registryDeps.
- `tsconfig.json`: `@/components/tree` alias. `src/lib/doc.ts` untouched
  (`display` category already existed).
- Docs `docs/tree/`: hero `demo.tsx` + `demo-icons`, `demo-selected`,
  `demo-actions`, and `doc.mdx` (Installation → Usage → Examples → Props for
  `Tree` / `TreeDataItem` / `TreeRenderItemParams`). All four demos pass icon /
  action **functions** into the client `Tree`, so each carries `'use client'` —
  without it Next throws "Functions cannot be passed directly to Client
  Components" at the RSC boundary (caught and fixed during verification).

Verification: `pnpm registry:build` emits `public/r/tree.json`; `tsc --noEmit`
clean; `biome check registry/ikui/tree.tsx docs/tree/` clean; `pnpm lint` reports
0 errors (1 info). Dev server renders `/docs/tree` 200 with all four demos
(no error boundary, no RSC serialization error); sidebar shows "Display › Tree".

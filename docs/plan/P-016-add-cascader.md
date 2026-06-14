# P-016 — Add cascader component (Base UI port of cascader-shadcn)

Status: completed
Task: T-016

## Goal

Add a `cascader` registry component — a column-based cascading dropdown for
selecting a path through hierarchical data (region → city → district, category
trees, org charts). Ported from the MIT `cascader-shadcn` reference in
`tmp/cascader-shadcn`, re-themed onto ikui's Base UI primitives.

## Current state

- Reference `tmp/cascader-shadcn/src/components/ui/cascader.tsx` (~450 lines) is
  Radix/shadcn-flavored: it uses `<PopoverTrigger asChild>` / `<DrawerTrigger
  asChild>` and shadcn focus tokens (`ring-offset-background`,
  `focus-visible:ring-ring focus-visible:ring-offset-2`).
- ikui is locked to Base UI. The project already ships every primitive the
  component needs: `src/components/ui/popover.tsx` (Base UI),
  `src/components/ui/drawer.tsx` (vaul), `src/hooks/use-mobile.ts`
  (`useIsMobile`). `lucide-react` and `vaul` are already in `package.json`.
- Base UI triggers take a `render` prop, **not** `asChild` (confirmed: select /
  dialog / sheet / sidebar all use `render=`; `asChild` appears nowhere). This is
  the one real API gap in the port.
- No existing category fits a form/select control (current: audio, video,
  timeline, image, button, blocks).

## Proposal

`registry/ikui/cascader.tsx` (`registry:component`, `category: form`):

- Copy the reference logic verbatim (columns model, controlled/uncontrolled
  `value`, `expandTrigger` click/hover, keyboard nav, `allowClear`,
  `displayRender`, mobile Drawer / desktop Popover split). The data model and
  interaction are sound and stay as-is.
- **Base UI adaptations (the only substantive changes):**
  - `<PopoverTrigger asChild>{trigger}</PopoverTrigger>` →
    `<PopoverTrigger render={trigger} disabled={disabled} />`.
  - Keep `<DrawerTrigger asChild>` — vaul supports it.
  - Retheme the trigger's focus/border to ikui's `select` convention
    (`border-input bg-transparent focus-visible:border-ring focus-visible:ring-3
    focus-visible:ring-ring/50`), dropping the Radix `ring-offset-*` classes.
  - Drop the undefined `scrollbar-thin` utility (not in this Tailwind setup).
  - Import from `@/components/ui/popover`, `@/components/ui/drawer`,
    `@/hooks/use-mobile` (all real src files; resolve at build).
- `registry.json` item: `dependencies: ["lucide-react"]`,
  `registryDependencies: ["popover", "drawer", "use-mobile"]`,
  `category: "form"`.
- `tsconfig.json`: add `@/components/cascader` → `registry/ikui/cascader.tsx`
  (matches every other registry component's public import path).
- `src/lib/doc.ts`: add `form: 'Form'` to `CATEGORY_LABELS` and `'form'` to
  `CATEGORY_ORDER` so the sidebar groups it.
- Docs `docs/cascader/`:
  - `demo.tsx` — hero: raw `<Cascader>` with a small region tree, uncontrolled.
  - `doc.mdx` — Hero → Installation → Usage → Examples (controlled value,
    hover expand, disabled options + `allowClear`, custom `displayRender`) →
    Props (`PropsTable` for `CascaderProps`).

## Risks

- Base UI Popover `render` merging custom event handlers onto the `div`
  combobox trigger — verify open/close + keyboard still work in the rendered
  doc page.
- `PopoverContent` defaults to `w-72 p-2.5 gap-2.5`; the columns need
  `w-auto p-0` — confirm `cn`/tailwind-merge wins and the panel sizes to its
  columns.
- New `form` category touches shared `doc.ts` (small, sanctioned by AGENTS.md).

## Scope

In: the one component, its registry entry, tsconfig alias, the `form` category
label, and the `docs/cascader` pages. Out: any change to existing components,
the shared popover/drawer primitives, or new dependencies.

## Steps

1. Write `registry/ikui/cascader.tsx` (port + Base UI adaptations).
   verify: typechecks; imports resolve.
2. `registry.json` item + `tsconfig.json` alias + `doc.ts` `form` category.
   verify: `pnpm registry:build` emits `public/r/cascader.json` with the deps.
3. `docs/cascader/demo.tsx` + `doc.mdx` (+ example demos).
   verify: doc route renders; sidebar shows "Form › Cascader".
4. `pnpm lint` + `pnpm build`.
   verify: green; cascader opens, navigates columns, selects a leaf, clears.

## Result

- `registry/ikui/cascader.tsx` — the Base UI port. Logic verbatim from the
  reference; the only changes: `PopoverTrigger render={triggerElement}` (Base UI
  has no `asChild`), trigger retheme to ikui's `select` focus tokens, dropped
  `scrollbar-thin`, and a stable column `key` (parent value, not array index).
  `disabled` is enforced purely via the trigger's `pointer-events-none` /
  `tabIndex=-1` (no invalid `disabled` attr on the `div`/Base UI/vaul triggers).
- `registry.json` + `public/r/cascader.json` (via `pnpm registry:build`):
  `registry:component`, `category: form`, deps `lucide-react`, registryDeps
  `popover` / `drawer` / `use-mobile`.
- `tsconfig.json`: `@/components/cascader` alias. `src/lib/doc.ts`: `form: 'Form'`
  category (label + order) → sidebar group "Form".
- Docs `docs/cascader/`: hero `demo.tsx` (raw, uncontrolled) + `doc.mdx`
  (Installation → Usage → Examples: controlled / hover / disabled / custom
  display → Props for `CascaderProps` and `CascaderOption`). `demo-controlled`
  needs `'use client'` (uses `useState`).

Verification: `pnpm lint` clean for all new files; `pnpm exec tsc --noEmit`
reports zero errors in cascader files; `next build` compiles successfully.

Note (out of scope): `pnpm build` typecheck fails on the pre-existing untracked
`src/components/ui/calendar.tsx` (`table` not in react-day-picker `ClassNames`)
— unrelated to this task; surfaced to the user, not fixed.

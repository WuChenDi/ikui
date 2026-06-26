# P-020 — Add heatmap-calendar component (port of shadcn-heatmap)

Status: completed
Task: T-020

## Goal

Add a `heatmap-calendar` registry component — a GitHub-style contribution
heatmap that lays dated values onto a weeks × weekdays grid, buckets each day
into a color level, and labels months/weekdays. Ported from the MIT
`shadcn-heatmap` reference in `tmp/shadcn-heatmap`, re-themed onto ikui's Base UI
primitives.

## Current state

- Reference `tmp/shadcn-heatmap/components/heatmap-calendar.tsx` is Radix/shadcn:
  it wraps the grid in `Card`/`CardHeader`/`CardTitle` with a hardcoded `title`
  ("Activity"), uses the shadcn `Tooltip` (`TooltipProvider delayDuration`,
  `<TooltipTrigger asChild>`), and shadcn focus tokens (`ring-offset-background`,
  `focus-visible:ring-offset-2`).
- ikui is locked to Base UI and ships a Base UI `tooltip` primitive
  (`src/components/ui/tooltip.tsx`: `TooltipProvider delay`, trigger via `render`
  prop, no `asChild`). `display` category already exists (chart, spark-chart,
  qr-code).

## Proposal

`registry/ikui/heatmap-calendar.tsx` (`registry:component`, `category: display`):

- Keep the data model verbatim (range/weeks/columns build, level bucketing,
  palette vs class levels, legend config, axis-label config, month-label
  spacing). The logic is sound.
- **Rewrites (the "bad parts"):**
  - Drop the `Card`/`CardHeader`/`CardTitle` wrapper and the `title` prop — the
    primitive should be pure (memory: keep registry primitives pure). Card/title
    is composition for the consumer/demo, not the component. Removes the `card`
    dependency; only `tooltip` remains.
  - Base UI tooltip: `TooltipProvider delay={80}`, and
    `<TooltipTrigger render={<button .../>} />` instead of `asChild`.
  - Retheme cell focus to ikui (`outline-none focus-visible:ring-2
    focus-visible:ring-ring`); drop `ring-offset-*`.
  - Fix a latent TZ bug: `toKey` now formats a **local** day, so add `parseDate`
    to read bare `YYYY-MM-DD` as a local day (the reference mixed UTC `toISOString`
    key with `new Date(string)` parse). Otherwise a non-UTC zone shifts cells a day.
  - Use **date-fns** for all date work (`startOfDay`/`addDays`/`startOfWeek`/
    `differenceInCalendarDays`/`format`/`parseISO`) — `differenceInCalendarDays`
    is DST-safe (vs the reference's `/86400000`), and `format` (en-US default)
    replaces `toLocaleDateString` for month/weekday/cell labels. The latter is
    **required for SSR**: `toLocaleDateString` resolves the locale per environment
    (server "6月" vs client "Jun"), which breaks hydration. Adds the `date-fns`
    dependency.
  - Add a `getLevel` prop (default = the GitHub buckets) so consumers can rebucket.
  - Make `columns` a `useMemo` keyed on primitive `endTime`/`rangeDays`/
    `weekStartsOn` (stable), and give the legend swatches / weekday rows
    data-derived keys (biome `noArrayIndexKey`). `registry/ikui` IS biome-linted.
- `registry.json`: `dependencies: []`, `registryDependencies: ["tooltip"]`,
  `category: "display"`.
- `tsconfig.json`: `@/components/heatmap-calendar` alias.
- Docs `docs/heatmap-calendar/`: deterministic `sample-data.ts` (seeded, fixed
  `END_DATE` to avoid hydration drift) + hero `demo.tsx` + examples
  (palette / legend placement / custom tooltip / compact) + `doc.mdx`
  (Hero → Installation → Usage → Examples → Props incl. LegendConfig +
  AxisLabelsConfig).

## Scope

In: the one component, its registry entry, tsconfig alias, and the
`docs/heatmap-calendar` pages. Out: changes to existing components, the shared
tooltip primitive, new deps, or `doc.ts` (the `display` category already exists).

## Result

- `registry/ikui/heatmap-calendar.tsx` — pure heatmap (no Card/title), Base UI
  tooltip, local-day keying, stable memoized columns.
- `registry.json` + `public/r/heatmap-calendar.json` (via `pnpm registry:build`):
  `category: display`, registryDep `tooltip`.
- `tsconfig.json`: `@/components/heatmap-calendar` alias.
- Docs `docs/heatmap-calendar/`: `sample-data.ts`, hero `demo.tsx`,
  `demo-palette` / `demo-legend` / `demo-tooltip` / `demo-compact`, `doc.mdx`.

Verification: `pnpm exec biome check` clean for all new files; `pnpm exec tsc
--noEmit` reports zero errors in heatmap files; `/docs/heatmap-calendar` renders
(HTTP 200, title + all examples + grid cells present, no real hydration/404).
Pre-existing repo lint errors (`src/lib/llm.ts`, `biome.json` deprecation) are
unrelated and untouched.

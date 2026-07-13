# P-024 — Add date-range-picker component (range calendar + quick presets)

Status: completed
Task: T-042

## Goal

Add a `date-range-picker` registry component: a popover date **range** picker with
a quick-preset side panel (Today / Yesterday / Last 7 days / This month / …), a
two-month calendar with live hover-range preview, min/max clamping, and a
clearable trigger. Lives in the `form` category. Ported from
`mg-ikkyu-web/src/components/IK/IKDateRangePicker.tsx`, adapted to ikui
conventions (Base UI popover, English strings, copy-pasteable).

## Current state

- Reference `IKDateRangePicker.tsx` (mg-ikkyu-web) is a self-contained control
  built on shadcn `Popover` + `Calendar` (react-day-picker) + `Button`. Good
  behavior worth keeping: draft/commit split (hover doesn't leak to the caller),
  custom two-click range with sorted from/to, hover preview, `minDate`/`maxDate`
  clamping, clearable, controlled/uncontrolled.
- It is **hardcoded Chinese**: preset labels (今天/昨天/…) and `locale: zhCN`
  everywhere. ikui is an English copy-paste library — repo rule: no Chinese in
  code/docs.
- ikui already has every primitive needed: `src/components/ui/calendar.tsx`
  (react-day-picker 10), `popover.tsx` (Base UI), `button.tsx`; deps `date-fns`,
  `react-day-picker` are already in `package.json`. No dependency additions.
- ikui `Popover` is Base UI: `PopoverContent` supports `align`/`side` but not
  shadcn's `portalContainer`, and defaults to `w-72 p-2.5` — must override with
  `className="w-auto p-0"`. The reference's absolute clear button relied on
  `portalContainer`; will be restructured to not need it.
- `form` category already exists in `src/lib/doc.ts` (input, password-input,
  cascader, …) — no doc.ts change.

## Proposal

Port the reference to `registry/ikui/date-range-picker.tsx`
(`registry:component`, `category: form`), keeping the interaction logic,
adapting to ikui:

- **API**: `DateRangePicker({ value?, defaultValue?, onChange?, placeholder?,
  className, clearable=true, minDate?, maxDate?, disabled?, numberOfMonths=2,
  presets?, locale?, dateFormat='yyyy-MM-dd' })`.
  - `value: DateRange | undefined` (react-day-picker `DateRange`), controlled or
    uncontrolled via `defaultValue`.
  - `presets?: DateRangePreset[]` where
    `DateRangePreset = { label: string; range: DateRange | (() => DateRange) }`.
    Defaults to an **English** preset set: Today, Yesterday, Last 7 days,
    Last 30 days, This week, Last week, This month, Last month. Pass `presets={[]}`
    to hide the side panel entirely.
  - `locale?` (date-fns `Locale`) optional — consumer supplies `zhCN` etc.;
    default is date-fns default (en-US). No hardcoded locale.
- **Behavior kept as-is**: draft vs committed range, two-click sorted range,
  hover preview with the same `classNames` styling, `clampDateRange` against
  min/max, close-on-second-click, cancel-incomplete-on-close, clearable.
- Trigger: ikui `Button variant="outline"` with `CalendarIcon`; clear `X` button
  rendered inside the trigger row (not via `portalContainer`).
- `PopoverContent className="w-auto p-0"` to neutralize the Base UI defaults;
  `align="start"`.
- lucide `CalendarIcon` + `X`; `cn()` from `@/lib/utils`.

**Simplicity notes**: no new abstraction beyond the `presets` prop (genuinely
useful for a library control and lets us keep the panel content out of the
component body). Everything else is a faithful 1:1 port.

Supporting changes (mirrors P-023):

- `registry.json` item: `dependencies: ["date-fns","react-day-picker",
  "lucide-react"]`, `registryDependencies: ["calendar","popover","button"]`,
  `category: "form"`.
- `tsconfig.json`: `@/components/date-range-picker` →
  `registry/ikui/date-range-picker.tsx` (for iframe/demo resolution, if the
  pattern requires it — verify against existing entries).
- Docs `docs/date-range-picker/`: hero `demo.tsx` (raw picker, default presets),
  plus `demo-presets.tsx` (custom presets), `demo-min-max.tsx` (bounded range),
  `demo-no-presets.tsx` (`presets={[]}`). `doc.mdx`: Hero → Installation → Usage
  → Examples → Props, per AGENTS.md doc skeleton.
- `pnpm registry:build`, then `pnpm lint` (Biome — registry files ARE linted).

## Risks

- Base UI Popover positioning/animation differs from shadcn; the two-month
  calendar width + `w-auto p-0` override needs a visual check in the docs page.
- react-day-picker `classNames` keys (`day_button`, `data-[range-start]`) must
  match ikui's `calendar.tsx` variant (v10) — verify the selectors exist.

## Verify

- `pnpm registry:build` regenerates `public/r/date-range-picker.json`.
- `pnpm lint` clean.
- Docs page renders: hero picker opens, presets apply, hover preview works,
  clear resets, min/max bounds respected (manual check in `pnpm dev`).

## Scope

New: `registry/ikui/date-range-picker.tsx`, `docs/date-range-picker/*`.
Edited: `registry.json`, `tsconfig.json` (maybe). Generated: `public/r/*`.
No changes to `src/lib/doc.ts` or unrelated components.

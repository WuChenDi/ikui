# P-022 — Add password-input component (built on input-group)

Status: completed
Task: T-040

## Goal

Add a `password-input` registry component — a password field with a trailing
show/hide toggle, composed from the existing `input-group` primitive. Lives in
the `form` category alongside `cascader`.

## Current state

- `src/components/ui/input-group.tsx` exports `InputGroup`, `InputGroupInput`,
  `InputGroupButton`, `InputGroupAddon` (+ text/textarea). It is a site-internal
  shadcn primitive, **not** a registry item.
- Registry components (`registry/ikui/*.tsx`) may import these via
  `@/components/ui/input-group` and declare `registryDependencies: ["input-group"]`
  so shadcn pulls the primitive on install (same mechanism cascader uses for
  `popover` / `drawer` / `use-mobile`).
- `form` category already exists in `src/lib/doc.ts` (label + order) — no change.

## Proposal

`registry/ikui/password-input.tsx` (`registry:component`, `category: form`):

- `PasswordInput({ className, disabled, ...props }: React.ComponentProps<"input">)`.
- `InputGroup` > `InputGroupInput` (`type` toggles `password`/`text`, spreads
  `...props` so name / value / onChange / placeholder are native) + an
  `inline-end` `InputGroupAddon` holding an `icon-xs` `InputGroupButton` that
  flips a `visible` state and swaps `Eye`/`EyeOff` from `lucide-react`.
- Button is `aria-pressed`, `aria-label`d, and inherits `disabled`.

Supporting changes (mirrors P-016):

- `registry.json` item: `dependencies: ["lucide-react"]`,
  `registryDependencies: ["input-group"]`, `category: "form"`.
- `tsconfig.json`: `@/components/password-input` →
  `registry/ikui/password-input.tsx`.
- Docs `docs/password-input/`:
  - `demo.tsx` — hero: raw `<PasswordInput defaultValue=... className="max-w-72" />`.
  - `demo-disabled.tsx`, `demo-addon.tsx` (leading lock-icon addon label).
  - `doc.mdx` — Hero → Installation → Usage → Examples (disabled, with addon) →
    Props (`PropsTable`, native input props passthrough).

## Risks

- `InputGroupButton` default `variant="ghost"`; `size="icon-xs"` gives a square
  icon button — confirm alignment in the rendered doc.
- Spreading `...props` onto `InputGroupInput` (the underlying `<input>`) — the
  caller's `type` must not override the visibility toggle; place `type` after
  `...props` would lose control, so `type` is set explicitly and `...props` does
  not carry one for a password field.

## Scope

In: the one component, its registry entry, tsconfig alias, and `docs/password-input`.
Out: changes to `input-group`, other components, new deps, strength meter /
validation.

## Steps

1. Write `registry/ikui/password-input.tsx`. verify: typechecks; imports resolve.
2. `registry.json` item + `tsconfig.json` alias.
   verify: `pnpm registry:build` emits `public/r/password-input.json` with deps.
3. `docs/password-input/` demos + `doc.mdx`.
   verify: doc route renders; sidebar shows "Form › Password Input".
4. `pnpm lint`. verify: green; toggle shows/hides; disabled blocks toggle.

## Result

- `registry/ikui/password-input.tsx` — closed `PasswordInput` over `InputGroup`:
  `InputGroupInput` (type toggles password/text, `...props` passthrough) + an
  `inline-end` `InputGroupAddon` with an `icon-xs` `InputGroupButton` swapping
  `Eye`/`EyeOff`. Button is `aria-pressed` / `aria-label`d / inherits `disabled`.
- `registry.json` + `public/r/password-input.json` (via `pnpm registry:build`):
  `registry:component`, `category: form`, deps `lucide-react`, registryDeps
  `input-group`.
- `tsconfig.json`: `@/components/password-input` alias. `src/lib/doc.ts` untouched
  (the `form` category already existed).
- Docs `docs/password-input/`: hero `demo.tsx` + `doc.mdx`
  (Installation → Usage → Examples → Props). Examples are **controlled** and
  **disabled** — dropped the planned "with addon label" example: the component is
  closed (input + trailing toggle only) and does not take addon children, so an
  addon demo would mean composing `InputGroup` by hand, defeating the point.
  `demo-controlled` needs `'use client'` (uses `useState`).

Verification: `biome check registry/ikui/password-input.tsx docs/password-input/`
is clean; `pnpm registry:build` emits `public/r/password-input.json` with the
declared deps. Out of scope: `pnpm lint` still reports a pre-existing format error
in the committed `src/lib/llm.ts` (commit 10c45d9) — untouched by this task,
surfaced to the user.

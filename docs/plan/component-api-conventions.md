# Component API conventions (proposal)

Status: approved — implemented
Task: audit finding C10 (campaign l1-2q7jtz04)

> **Implemented.** The conventions below were approved and applied across
> `registry/ikui`. Changes are additive where possible: `tree` keeps
> `initialSelectedItemId` as a deprecated alias, and the unused `default`
> exports on the `timeline-*` files were removed. See **Decision** for the
> resolved open questions and the per-question outcomes.

## Why

C10 [Low] flagged three cross-cutting inconsistencies in the `registry/ikui`
surface:

1. **Controlled / uncontrolled state is handled three different ways.**
2. **Ref forwarding exists on only 3 of 19 components**, with no rule for when.
3. **Export style varies** (4 distinct shapes across the registry).

ikui components are copy-pasteable, closed, single-file primitives. That makes a
shared, predictable API contract more valuable than in a linked library: a user
who has copied `tree.tsx` and `cascader.tsx` into the same app should not have to
relearn the state model, the ref rule, or the import shape per component.

## Current state (audited 2026-07-04)

19 components in `registry/ikui/*.tsx`.

### 1. Controlled / uncontrolled

Only components that own interactive selection state are relevant. Data-display
components (`heatmap-calendar`, `spark-chart`, `qr-code`, `chart`,
`particle-image`, …) take a `value`/`data` input and hold no user-editable state
— they are out of scope for this axis.

| Component    | Model                | Props                                                             |
| ------------ | -------------------- | ---------------------------------------------------------------- |
| `image-crop` | controlled-only      | `crop?` + `onChange` (required); no `defaultCrop`                 |
| `cascader`   | dual (controlled *and* uncontrolled) | `value?` + `defaultValue?` + `onChange?`         |
| `tree`       | uncontrolled-only    | `initialSelectedItemId?` + `onSelectChange?`; state kept internally |

`cascader` already implements the canonical dual pattern:

```ts
// registry/ikui/cascader.tsx
const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue || [])
const selectedValue = value !== undefined ? value : internalValue
```

`tree` initializes once from a prop and never re-syncs:

```ts
// registry/ikui/tree.tsx
const [selectedItemId, setSelectedItemId] = React.useState(initialSelectedItemId)
```

`image-crop` documents "controlled value: set it from `onChange` and pass it
back in" and offers no uncontrolled path.

Three components, three different contracts for the same problem.

### 2. Ref forwarding

`React.forwardRef` is used by **3 of 19** components, and the ref target is not
consistent:

| Component        | Ref type            | Kind                              |
| ---------------- | ------------------- | --------------------------------- |
| `copy-button`    | `HTMLButtonElement` | DOM node passthrough              |
| `thumbnail-strip`| `HTMLCanvasElement` | DOM node passthrough              |
| `qr-code`        | `QRCodeHandle`      | imperative handle (`useImperativeHandle`) |

The other 16 components forward no ref, so a consumer cannot attach one to their
root element even when it would be reasonable (e.g. focus management, measuring).

### 3. Export style

Four distinct shapes are in use:

| Shape                                             | Components                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `export function Name() {}`                       | tree, cascader, image-crop, image-grid, image-compare, particle-image, heatmap-calendar, spark-chart, audio-waveform, segmented-timeline-strip, timeline-ruler |
| `const Name = …; export { Name }`                 | copy-button, password-input, thumbnail-strip, waveform-player    |
| `export const Name = React.forwardRef(…)`         | qr-code                                                          |
| dual: `export function Name` **and** `export default Name` | timeline-element, timeline-playhead                     |

`chart` additionally re-exports a group (`export { ChartContainer, … }`).

Only `timeline-element` and `timeline-playhead` carry a `default` export, and
nothing in the registry consumes it (imports elsewhere use the named form), so
the default is dead surface.

## Proposal

### C-1 — State model: prefer the dual controlled/uncontrolled pattern

For any component that owns user-editable selection/value state, expose all
three of:

- `value?` (controlled)
- `defaultValue?` (uncontrolled initial)
- `onChange?` (or a domain-specific `onXChange`)

Resolve with the `cascader` idiom (adopt it verbatim as the reference):

```ts
const [internal, setInternal] = React.useState(defaultValue)
const current = value !== undefined ? value : internal
// on user action:
if (value === undefined) setInternal(next)
onChange?.(next)
```

Rationale: it is the React-ecosystem norm (Base UI, Radix, native inputs), it
subsumes both existing single-mode components, and it fixes C1 (`tree` never
re-syncing a controlled selection) as a side effect once `tree` migrates.

**Naming:** the primary value prop should be named for the domain
(`selectedId`/`crop`/`value`), with `default<Prop>` and `on<Prop>Change` paired
consistently. Avoid mixing `initial*` (tree) and `default*` (cascader) prefixes —
standardize on `default*`.

### C-2 — Ref forwarding: forward the root DOM node by default; handles by exception

- Interactive/root-rendering components **should** `forwardRef` to their
  outermost DOM element (the pattern `copy-button` and `thumbnail-strip` already
  use). This is cheap and unblocks consumer focus/measure/scroll needs.
- Use an **imperative handle** (`useImperativeHandle`, like `qr-code`'s
  `QRCodeHandle`) only when the component genuinely exposes actions a DOM ref
  can't (`download()`, `getDataURL()`), and name the handle type
  `<Component>Handle`.
- Pure data-display components with no meaningful single root (or that render a
  fragment) may skip refs; note it in their doc rather than forwarding to an
  arbitrary child.

### C-3 — Export style: single named export, no default

- Standardize on a **named export** of the component. Two equivalent forms are
  acceptable so `forwardRef` components don't need rewriting:
  - `export function Name() {}` for plain components.
  - `const Name = React.forwardRef(…); export { Name }` for ref-forwarding ones.
- **Remove `default` exports.** They are inconsistent (only 2 components), unused
  by any consumer, and force copy-paste users to pick an import style.
- Companion helpers/types (`convertToPixelCrop`, `QRCodeHandle`, chart subparts)
  stay named exports alongside the component.

### C-4 — Shared passthrough props (consistency, not new API)

Where it does not conflict with the component's own props, extend the relevant
`React.*HTMLAttributes<T>` and spread the rest onto the root (as `tree`,
`copy-button`, `password-input`, and `chart` already do), and always accept
`className` merged via `cn()`. 15 of 19 components already accept `className`;
this closes the remaining gap so every root is style-overridable.

## Adoption (if approved) — non-breaking first

None of this ships as part of C10. Suggested sequencing when scheduled:

1. **Additive, non-breaking:** add `default*` + `value?` to `tree` (keep
   `initialSelectedItemId` as a deprecated alias), add root `forwardRef` to
   components that lack it. No consumer breaks.
2. **Deprecate:** mark `initialSelectedItemId` and the `timeline-*` default
   exports as deprecated in their doc pages + JSDoc.
3. **Breaking, batched behind a version note:** add a `defaultCrop` uncontrolled
   path to `image-crop`; remove deprecated aliases and default exports.

Each step is its own approved change with its own doc/demo updates and a green
`pnpm lint && pnpm build` + `pnpm registry:build`.

## Resolved open questions

- **Value-prop naming** — keep domain-specific names with `default*`/`on*Change`
  affixes (not the generic `value`/`onValueChange`). `tree` now exposes
  `selectedId` / `defaultSelectedId` / `onSelectChange`, with
  `initialSelectedItemId` retained as a deprecated alias.
- **Ref forwarding** — forward the root DOM node on interactive/root-rendering
  components only (`cascader`, `waveform-player`, `password-input`,
  `image-compare` gained it). Pure data-display / fragment components are left
  without a root ref by design.
- **`image-crop`** — kept controlled-only, as its fully-derived crop makes that
  the correct model; no dual pattern forced.

## Deviations

- **`image-crop` `defaultCrop` skipped.** The optional uncontrolled path was not
  added: a module-level `defaultCrop` helper name already exists and `crop` is
  read at ~20 sites, so an internal-state fork reintroduces the derived-every-
  render complexity the proposal explicitly says to avoid. `image-crop` stays
  controlled-only.
- **Components intentionally without a root ref** (per the ref-forwarding
  decision): `chart`, `heatmap-calendar`, `spark-chart`, `particle-image`,
  `image-grid`, and `qr-code` (which already exposes an imperative `QRCodeHandle`
  instead). These are data-display or fragment-rendering and gain no root-ref.

## Decision

Approved and implemented. C-1..C-4 applied per the resolved answers above.
`pnpm lint && pnpm registry:check && pnpm build` green.

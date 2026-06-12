# P-006 — Add audio-trimmer component (waveform clip selector)

Status: completed
Task: T-006

## Goal

Add a pure, reusable **audio clipping** primitive to the ikui registry: a
waveform-backed in/out region selector. The user drags edge handles (or the
region body) over an audio waveform to choose a `[start, end]` range in
seconds; the component reports the selection. It is the standalone essence of
the trim interaction that `bycut` embeds inside its full timeline editor —
lifted out of the editor store, fps, snapping, and playbackRate coupling.

Lives in the `timeline` category alongside `timeline-ruler`, so audio (now)
and video (later) clipping flows can compose it.

## Current state

- `bycut` trims via `useTimelineElementResize` — left/right resize handles on a
  timeline element, deeply coupled to `EditorCore`, project fps, snapping, and
  `playbackRate`. Not reusable on its own.
- ikui already ships `audio-waveform` (pure canvas waveform: peaks, width,
  progress) and `waveform-player` (waveform + play/pause). No selection/trim UI.

## Proposal

New component `registry/ikui/audio-trimmer.tsx`, composing `audio-waveform` as
its background (`registryDependencies: ["@ikui/audio-waveform"]`).

Behavior:
- Waveform fills the component width; region math is in fractions of `duration`
  (percentage-based left/width), so it stays resolution-independent and matches
  how `audio-waveform` resamples to width.
- Two draggable edge handles set `start` / `end`; dragging the region body
  moves the whole selection. Area outside the selection is dimmed.
- Pointer Events for drag (matches `image-crop`). Handles are focusable; arrow
  keys nudge by `step`.
- Controlled (`start`/`end`) and uncontrolled (`defaultStart`/`defaultEnd`).
- `minDuration` / `maxDuration` clamp the selection.
- `onChange(range)` during drag, `onChangeEnd(range)` on release.
- Optional `playhead` (seconds, display-only cursor) — **no audio playback baked
  in**. Per the keep-primitives-pure precedent (timeline-ruler), playback/seek
  belongs to the consumer; a doc Example wires a real `<audio>` element.

Props (draft):
`audioUrl? | blob? | audioBuffer? | peaks?`, `duration`, `start?/end?`,
`defaultStart?/defaultEnd?`, `minDuration?/maxDuration?`, `step?`, `height`,
`playhead?`, waveform pass-through (`barColor`, `barPlayedColor`, `barWidth`,
`gap`), `onChange?`, `onChangeEnd?`, `className?`, `style?`.

Out of scope (consumer/demo concern): audio playback/preview, encoding/exporting
the trimmed clip, the timeline ruler (compose separately).

## Deliverables

- `registry/ikui/audio-trimmer.tsx`
- `registry.json` entry — category `timeline`, dep `@ikui/audio-waveform`
- `docs/audio-trimmer/{demo.tsx, doc.mdx}` (+ `demo-player.tsx` Example wiring a
  real `<audio>` for preview/playhead)
- `pnpm registry:build` to regenerate `public/r/*`

## Risks

- Region/handle math must share the waveform's pixel-per-second basis — solved
  by going percentage-of-duration rather than px.
- Controlled/uncontrolled dual mode adds branches; keep minimal.
- Not building a generic media-trimmer now (video later) — the drag/region
  kernel is separable and can be lifted when video clipping is built; building
  generic now violates Simplicity First.

## Alternatives

- A. Selection-only, playback via prop/Example — **recommended**.
- B. Built-in audio playback (play button + moving playhead). More useful
  standalone but couples an audio element and breaks the pure-primitive
  precedent; better as a doc Example.
- Name: `audio-trimmer` (recommended) / `audio-clip` / `waveform-trimmer`.

## Steps

1. Implement `audio-trimmer.tsx` (waveform + region + handles + drag/keyboard).
   verify: drag edges/body updates `[start,end]`; clamps to `0..duration`,
   `min/maxDuration`; keyboard nudges; controlled + uncontrolled both work.
2. Register in `registry.json`; `pnpm registry:build`.
   verify: `public/r/audio-trimmer.json` emitted with `@ikui/audio-waveform` dep.
3. Author `docs/audio-trimmer/` (raw hero demo + `### Wired to playback` Example).
   verify: hero renders raw component; Example shows real `<audio>` preview.
4. `pnpm lint` + `pnpm build`.
   verify: green; page prerenders.

## Result

Shipped `registry/ikui/audio-trimmer.tsx` (option A — selection-only, playback
left to the consumer), registered under category `timeline` with dep
`@ikui/audio-waveform`, plus `docs/audio-trimmer/` (raw hero `demo.tsx` +
`### Wired to playback` Example `demo-player.tsx` driving a real `<audio>`).
`pnpm registry:build` emits `public/r/audio-trimmer.json`.

Verification: `pnpm lint` clean; `pnpm build` green with `/docs/audio-trimmer`
prerendered. No browser tooling available, so drag/keyboard interaction was
verified by code review, not a live browser run.

### Revision — clip aesthetic + ruler demo (option A)

Feedback: the bare blue-box look was too plain vs `bycut`. Reworked the visual
layer of `audio-trimmer` to the editor clip look (kept all drag/keyboard
logic): rounded clip container, `color` fill behind the selection, white
waveform on top, dark dim outside, white border + grip handles. Defaults
`color` → `rgb(139,92,246)`, `barColor` → white. Handles render via a plain
function (not a nested component) to preserve focus across renders.

Added `docs/audio-trimmer/demo-timeline.tsx` + a `### In a timeline` Example
composing the trimmer under `timeline-ruler` at a shared width.

Extraction assessment of `bycut`'s `panels/timeline/*`: most are editor business
coupled to `EditorCore`/stores (`timeline-toolbar`, `bookmarks`,
`transition-overlay`, `snap-indicator`, `drag-line`, `index`, and the
store-driven `timeline-track`/`timeline-playhead`/`timeline-element`) — **not**
extracted. The only reusable shape missing was the clip block, folded into
`audio-trimmer` (option A) rather than a separate `timeline-clip` primitive
(revisit if a video trimmer later duplicates it). Ruler, waveform, and
thumbnail strips were already extracted.

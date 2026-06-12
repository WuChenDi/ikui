# P-007 — Replace audio-trimmer with generic timeline-element clip

Status: completed
Task: T-007
Supersedes: T-006 (audio-trimmer)

## Goal

`audio-trimmer` welded a waveform to a selection and "啥都不像" — wrong
altitude. The reusable primitive the roadmap needs (audio *and* video
trimming, composed with `timeline-ruler`) is a generic **timeline clip**:
a positioned, colored, trimmable block that holds arbitrary content. Extract
`timeline-element` (the store-free essence of bycut's `timeline-element`) and
drop `audio-trimmer`.

## Current state

- `audio-trimmer` (T-006) — waveform + hollow selection, single-purpose, not
  composable into a real timeline. To be removed.
- `timeline-ruler` — positions ticks by `startTime * pixelsPerSecond * zoom`.
- `audio-waveform`, `thumbnail-strip` — content that goes *inside* a clip.

## Proposal

New component `registry/ikui/timeline-element.tsx`, category `timeline`.

It positions itself on a track by time, on the **same basis as the ruler** so
they line up when composed:
- `left = startTime * pixelsPerSecond * zoom`, `width = duration * pps * zoom`
  (defaults `pixelsPerSecond = 50`, `zoom = 1`). Drop it into a
  `position: relative` track and it sits under the ruler at the right place.
- `children` render the clip content — `<AudioWaveform>`, `<ThumbnailStrip>`,
  a label, anything. The element is content-agnostic.
- `color` fill, rounded, `height`, `selected`.
- When `selected` (and `trimmable`): bycut-style selection border + left/right
  **trim handles**. Dragging a handle resizes the clip and emits
  `onResize({ startTime, duration })` during drag and `onResizeEnd` on release;
  clamped to `startTime >= 0` and `minDuration`.
- `onSelect` on pointer down.

Props (draft): `startTime`, `duration`, `pixelsPerSecond?`, `zoom?`, `height?`,
`color?`, `selected?`, `trimmable?`, `minDuration?`, `onSelect?`, `onResize?`,
`onResizeEnd?`, `children`, `className?`, `style?`.

Out of scope (consumer concern, per keep-primitives-pure): the track lane,
playhead, seeking, snapping, drag-to-reorder, and mapping a trim back to a
media source offset. Body drag-to-move is **deferred** (ask if wanted).

## Deliverables

- `registry/ikui/timeline-element.tsx` + registry.json entry (category
  `timeline`; no registryDependencies — content is the consumer's).
- Remove `audio-trimmer`: `registry/ikui/audio-trimmer.tsx`, its registry.json
  entry, `docs/audio-trimmer/`. Keep the freesound sample URL helper, relocated
  for reuse.
- `docs/timeline-element/`:
  - hero `demo.tsx` — one audio clip (`AudioWaveform` inside a `TimelineElement`).
  - `### Combined with the ruler` — `timeline-ruler` + a track of
    `TimelineElement`s (an audio clip; a video clip via `ThumbnailStrip`)
    sharing one width, trimmable — the "ruler + audio/video" composition.
- `pnpm registry:build`.

## Risks

- Trim of the left edge moves `startTime`; the content (`children`) just
  rescales to the new width (not source-accurate). Acceptable for a pure
  geometry primitive; document it.
- Removing `audio-trimmer` is a deletion of shipped T-006 work — intended.

## Alternatives

- Keep `audio-trimmer` *and* add `timeline-element` — rejected: the trimmer is
  subsumed (audio clip = `TimelineElement` + `AudioWaveform`) and the user
  called it useless.
- Name `timeline-clip` instead of `timeline-element` — `timeline-element`
  matches bycut; open to `timeline-clip` if preferred.

## Steps

1. Implement `timeline-element.tsx` (position + selection + trim handles).
   verify: left/width track time·pps·zoom; trim emits clamped geometry;
   keyboard nudge on handles; selected border + handles.
2. Remove `audio-trimmer` (component, registry entry, docs); relocate sample
   helper. verify: no dangling imports; `registry:build` clean.
3. Register `timeline-element`; author `docs/timeline-element/`.
   verify: hero audio clip renders; ruler+clips demo aligns and trims.
4. `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-element` prerendered; no `/docs/audio-trimmer`.

## Result

Shipped `registry/ikui/timeline-element.tsx` — controlled clip positioned by
`startTime/duration × pixelsPerSecond × zoom`, content-agnostic `children`,
selection border + left/right trim handles emitting `{startTime,duration}` via
`onResize`/`onResizeEnd`, keyboard nudge, clamped to `0` / `minDuration`.
Registered under category `timeline` (no registryDependencies).

Removed `audio-trimmer` (component, registry entry, `public/r/audio-trimmer.json`,
`docs/audio-trimmer/`). Sample helpers relocated to
`docs/timeline-element/sample.ts` (audio + video URLs, `useAudioDuration`).

Docs `docs/timeline-element/`: hero `demo.tsx` (audio clip, waveform anchored to
the timeline and windowed by the clip) + `### Combined with the ruler`
`demo-ruler.tsx` (timeline-ruler + a video track via `thumbnail-strip` and an
audio track via `audio-waveform`, both trimmable, click to select).

Verification: `pnpm lint` clean; `pnpm build` green; `/docs/timeline-element`
prerendered; `/docs/audio-trimmer` gone; no dangling `audio-trimmer` refs. No
browser tooling, so trim drag verified by code review, not a live run.

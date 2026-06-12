# P-010 — Update timeline-ruler "In a timeline" to use timeline-playhead

Status: completed
Task: T-010

## Goal

The ruler's `### In a timeline` example (`docs/timeline-ruler/demo-timeline.tsx`)
hand-rolls a playhead marker and a pointer-capture drag-scrub. Now that
`timeline-playhead` exists, use it — keeping the example's actual point: the
ruler embedded above tracks sharing **one** `scrollRef`, with zoom adapting the
labels.

## Proposal

- Replace the manual rose playhead `<div>` + `draggingRef` pointer-capture
  handlers with `<TimelinePlayhead currentTime={playhead} duration zoom
  pixelsPerSecond={PPS} onSeek={setPlayhead} />`, placed as the last child of the
  shared-scroll content so it spans the ruler and both tracks.
- Keep click-to-seek on the content (`onPointerDown` → set playhead); the
  playhead handles its own knob drag.
- Keep the zoom controls, the shared `scrollRef`, both tracks (`thumbnail-strip`
  + `audio-waveform` with `progress` up to the playhead). Tracks stay raw — the
  example is about the ruler, not clips.
- Tidy the explanatory copy ("click to move; drag the knob to scrub").

Docs-only; no component changes.

## Steps

1. Rewrite `demo-timeline.tsx` to use `TimelinePlayhead`; drop dead code/imports.
   verify: playhead scrubs + click-seek; zoom + shared scroll still work.
2. `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-ruler` prerendered.

## Result

`docs/timeline-ruler/demo-timeline.tsx` now uses `<TimelinePlayhead>` instead of
the hand-rolled rose marker + pointer-capture scrub. Dropped `draggingRef`, the
`onPointerMove/Up` capture handlers, and `playheadX`; content `onPointerDown`
keeps click-to-seek, the playhead handles its own knob drag. Zoom controls,
shared `scrollRef`, and both raw tracks unchanged. `pnpm lint` clean; `pnpm
build` green; `/docs/timeline-ruler` prerendered.

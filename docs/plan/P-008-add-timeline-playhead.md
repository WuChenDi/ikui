# P-008 — Add timeline-playhead component (draggable scrubber)

Status: completed
Task: T-008

## Goal

Complete the pure timeline primitive set (`timeline-ruler` + `timeline-element`
+ this) so a consumer can assemble a real editor timeline. Extract the
store-free essence of bycut's `timeline-playhead`: a vertical playhead line +
top knob, positioned by time on the **same basis as the ruler/element**,
draggable to scrub.

## Current state

- bycut `timeline-playhead` — a 2px line + round head at `time × pps × zoom`,
  coupled to `useEditor` (duration/seek) and `useTimelinePlayhead` (scrub math)
  and a manual scroll-sync transform.
- ikui has `timeline-ruler` and `timeline-element`, both positioned by
  `× pixelsPerSecond × zoom`. No playhead.

## Proposal

`registry/ikui/timeline-playhead.tsx`, category `timeline`, no
registryDependencies.

- Controlled `currentTime`; renders absolutely at `left = currentTime × pps ×
  zoom`, `top: 0; bottom: 0` so it spans whatever relative container it is
  placed in (one track, or the whole ruler+tracks stack).
- Drag the line/knob to scrub → measures pointer x against the parent's rect
  (`x / pps`), clamps `0..duration`, emits `onSeek(time)`. Because it lives
  inside the scrolled content, it scrolls with the tracks — no manual
  scroll-sync needed.
- Keyboard: focusable, arrow keys nudge by `step`, emit `onSeek`.
- `color`, `className`, `style`.

Out of scope (consumer): click-on-ruler/track to seek (the consumer wires the
container's click to `onSeek`); playback clock.

## Deliverables

- `registry/ikui/timeline-playhead.tsx` + registry.json entry (category
  `timeline`).
- `docs/timeline-playhead/`:
  - hero `demo.tsx` — `timeline-ruler` + playhead; drag to scrub, click ruler to
    seek, time readout.
  - `### Across the tracks` `demo-timeline.tsx` — ruler + an audio/video clip
    track (`timeline-element`) + a full-height playhead spanning them,
    click-to-seek. Reuses `docs/timeline-element/sample.ts`.
- `pnpm registry:build`.

## Risks

- Scrub math depends on the parent being the time-scaled content of width
  `duration × pps`. Document that the playhead must sit in such a container.

## Steps

1. Implement `timeline-playhead.tsx` (position + drag scrub + keyboard).
   verify: drag emits clamped `onSeek`; keyboard nudges; scrolls with content.
2. Register; author docs (hero + across-tracks).
   verify: hero scrubs; across-tracks playhead spans ruler+clips and seeks.
3. `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-playhead` prerendered.

## Result

Shipped `registry/ikui/timeline-playhead.tsx` — controlled vertical playhead at
`currentTime × pixelsPerSecond × zoom`, spans its container (`top:0;bottom:0`),
drag line/knob to scrub (measured against the parent's rect → `onSeek`),
keyboard nudge, `color`. No registryDependencies; category `timeline`.

Docs `docs/timeline-playhead/`: hero `demo.tsx` (ruler + playhead, click-to-seek
+ readout) and `### Across the tracks` `demo-timeline.tsx` (ruler + audio clip
via `timeline-element` + full-height playhead, reusing
`docs/timeline-element/sample.ts`).

Verification: `pnpm lint` clean; `pnpm build` green; `/docs/timeline-playhead`
prerendered. Timeline category now holds the full primitive trio:
`timeline-ruler` + `timeline-element` + `timeline-playhead`. No browser tooling,
so scrub drag verified by code review, not a live run.

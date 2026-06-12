# P-009 — Add "segmented track" example to timeline-element docs

Status: completed
Task: T-009

## Goal

Show the composable answer to "segmented-timeline-strip has its own scale —
how does it fit the timeline primitives?": express a multi-segment video track
as multiple `timeline-element`s on one lane, sharing the ruler's
`pixelsPerSecond` and one `timeline-playhead`. Same feature set as
`segmented-timeline-strip` (active segment, playhead, click-to-seek) but built
from the pure trio, in the unified pps coordinate system.

## Proposal

New `docs/timeline-element/demo-segments.tsx`: load one `VideoThumbnailCache`,
split its duration into N back-to-back segments, render one `TimelineElement`
per segment (each windowing the full `ThumbnailStrip` by `-startTime × pps`),
under a shared `TimelineRuler` and over one `TimelinePlayhead`. Click a segment
to make it active (others dim) and to move the playhead.

Add a `### A segmented track` Example to `docs/timeline-element/doc.mdx`.

Docs-only; no component changes.

## Steps

1. Author `demo-segments.tsx`; wire into `doc.mdx`.
   verify: segments tile under the ruler; active highlight + playhead seek work.
2. `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-element` prerendered.

## Result

Added `docs/timeline-element/demo-segments.tsx` + a `### A segmented track`
Example in `doc.mdx`: one video split into 3 back-to-back `TimelineElement`s
(each windowing the shared `thumbnail-strip`), under one `timeline-ruler` and a
single `timeline-playhead`; click a segment to activate (others dim) and seek.
Docs-only. `pnpm lint` clean; `pnpm build` green; `/docs/timeline-element`
prerendered.

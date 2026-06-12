# P-011 — Unify timeline-ruler "In a timeline" styling with new demos

Status: completed
Task: T-011

## Goal

The ruler's `### In a timeline` demo predates the new timeline primitives and
looks different from the `timeline-element` / `timeline-playhead` demos: tracks
are flush (no gaps, no rounded clips), no inner padding, mismatched track
heights. Bring it to the shared convention so all timeline demos look the same.

## Proposal

Restyle `docs/timeline-ruler/demo-timeline.tsx` to match the other timeline
demos, keeping the ruler's unique features (shared `scrollRef` + zoom):

- Padded box `bg-muted/30 rounded-md border p-3` (padding on an outer box; the
  `scrollRef` scroll container stays inside it without padding so ruler
  virtualization is unaffected).
- Wrap both tracks in `TimelineElement` (rounded clips, `trimmable={false}`),
  one per lane, separated by `mt-2`; uniform `TRACK_HEIGHT = 56`.
- Ruler height `24` to match.
- Keep the zoom controls, playhead readout, `TimelinePlayhead`, audio `progress`.

Docs-only.

## Steps

1. Rewrite the demo's render to the shared layout; unify constants.
   verify: padded box, gapped rounded clips, zoom + shared scroll + playhead all
   still work.
2. `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-ruler` prerendered.

## Result

`docs/timeline-ruler/demo-timeline.tsx` restyled to the shared timeline-demo
convention: padded box (`bg-muted/30 rounded-md border p-3`), both tracks wrapped
in `TimelineElement` (`trimmable={false}`, rounded clips) on their own lanes with
`mt-2` gaps, uniform `TRACK_HEIGHT = 56`, ruler height `24`. Kept the shared
`scrollRef` + zoom, playhead readout, `TimelinePlayhead` (`#f43f5e`), and audio
`progress`. `pnpm lint` clean; `pnpm build` green; `/docs/timeline-ruler`
prerendered.

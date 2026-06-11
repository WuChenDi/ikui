# P-005 — Make hero demos raw (no business logic)

Status: completed
Task: T-005

## Goal

The hero `<DemoCanvas>` at the top of each doc should be the most basic display
of the component itself — no surrounding business scaffolding (zoom controls,
seek/percentage readouts, explanatory captions, full video-player wiring).
Business-heavy demos move down into `## Examples`.

## Changes

- `audio-waveform` — hero becomes a single static `<AudioWaveform>` at default
  styling. The current zoom/scroll/seek/percentage demo moves to
  `## Examples` / `### Zoomable timeline track` (`demo-timeline.tsx`).
- `thumbnail-strip` — drop the info-bar caption from the hero; keep only the
  scroll container + strip (scrolling is intrinsic to the component).
- `segmented-timeline-strip` — hero becomes the raw strip: one
  `VideoThumbnailCache` sliced into segments with a local click-to-seek
  playhead, no `<video>`. The full video-player integration moves to
  `## Examples` / `### Wired to a video player` (`demo-player.tsx`). The
  previously added single-cache example is promoted to the hero.
- `timeline-ruler` — hero becomes a static `<TimelineRuler duration={30} />`.
  The zoom-control demo moves to `## Examples` / `### Zooming`
  (`demo-zoom.tsx`), before `### In a timeline`.
- `waveform-player` — no change; its hero is already just `<WaveformPlayer>`.

## Steps

1. Relocate business demos into `demo-*.tsx`; rewrite `demo.tsx` heroes raw.
   verify: heroes render only component props, no external chrome.
2. Update the `doc.mdx` imports + Examples for the three components.
   verify: hero is raw; business demo is a `###` under `## Examples`.
3. `pnpm lint` + `pnpm build`.
   verify: green; pages prerender.

## Result

- `audio-waveform` — hero is now `<AudioWaveform blob height={64} />`. Old
  zoom/scroll/seek demo moved to `demo-timeline.tsx` →
  `### Zoomable timeline track` (placed before `### Custom bars`).
- `thumbnail-strip` — hero is just the scroll container + strip; the info-bar
  caption (and its loading skeleton) removed.
- `segmented-timeline-strip` — hero is the raw strip (one cache sliced into 5
  segments, local click-to-seek playhead, no `<video>`); the full video-player
  integration moved to `demo-player.tsx` → `### Wired to a video player`. The
  earlier `demo-single.tsx` was promoted to the hero and deleted.
- `timeline-ruler` — hero is now a static `<TimelineRuler duration={30} />`;
  the zoom-control demo moved to `demo-zoom.tsx` → `### Zooming` (before
  `### In a timeline`).
- `waveform-player` — unchanged (hero already raw).
- Verified: `pnpm lint` green (108 files); `pnpm build` green — all pages
  prerender.

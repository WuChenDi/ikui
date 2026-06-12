# P-012 — Add "audio trimming" business demo to timeline-element docs

Status: superseded by T-013
Task: T-012

> Superseded: the user does not want business examples living inside a component's
> docs. The audio-trimming composition is promoted to a standalone **Blocks**
> section (shadcn-style, iframe preview) under T-013; the demo authored here is
> reworked into the `audio-trimmer` block source. The doc.mdx Example added here
> was reverted.

## Goal

Demonstrate the full **audio trimming** business scenario built only from the
existing pure primitives — no new registry component. Trim an audio clip with
`timeline-element`'s handles, then actually play back **only the trimmed
selection** `[startTime, startTime + duration]`, with the playhead following and
an In / Out / length readout.

## Proposal

New `docs/timeline-element/demo-audio-trim.tsx`, composing:

- `TimelineRuler` — scale.
- one trimmable `TimelineElement` wrapping `AudioWaveform` (windowed by
  `-startTime × pps`, `progress` showing playback position inside the clip).
- `TimelinePlayhead` — scrub.
- a Play/Pause button driving an `HTMLAudioElement` that starts at
  `clip.startTime` and stops at `clip.startTime + clip.duration` (clamped in
  `timeupdate`); the playhead tracks `currentTime`.
- a readout: In / Out / selected length (mm:ss.s).

State: `clip`, `playing`, `currentTime`. Reuse `./sample`
(`SAMPLE_AUDIO_URL`, `useAudioDuration`). Primitives untouched; demo-layer only,
per the keep-primitives-pure rule (audio-trimmer primitive stays retired).

Add a `### Trimming an audio clip` Example to `docs/timeline-element/doc.mdx`.

## Steps

1. Author `demo-audio-trim.tsx`; wire into `doc.mdx`.
   verify: trim handles resize the clip; Play plays only the selection and stops
   at the out point; playhead follows; readout updates.
2. `pnpm registry:build` + `pnpm lint` + `pnpm build`.
   verify: green; `/docs/timeline-element` prerendered.

## Result

Added `docs/timeline-element/demo-audio-trim.tsx` + a `### Trimming an audio
clip` Example (placed first under `## Examples`). Composes `TimelineRuler` +
trimmable `TimelineElement`(`AudioWaveform`) + `TimelinePlayhead` with a
Play/Pause button that drives one `HTMLAudioElement`, plays only the trimmed
`[startTime, startTime + duration]` window (clamped in `timeupdate`), tracks the
playhead, colors the waveform via `progress`, and shows In / Out / length.
Demo-layer only; no primitive changes. `pnpm registry:build` + `pnpm lint`
clean; `pnpm build` green; `/docs/timeline-element` prerendered.

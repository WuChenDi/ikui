# P-014 — Real trim/export for the audio-trimmer block (mediabunny)

Status: completed
Task: T-014

## Goal

The `audio-trimmer` block only selects a region visually + plays it back; it does
not produce a trimmed file. Add real trimming: export the selected
`[startTime, startTime + duration]` as a downloadable audio file, using
**mediabunny** (`Conversion({ trim: { start, end } })`). bycut already ships
mediabunny for media processing; the API is first-class.

## Proposal

`registry/ikui/blocks/audio-trimmer.tsx`:

- **Load audio** — a file picker (`input[type=file] accept="audio/*"`) so users
  can trim their own audio; defaults to the bundled sample URL.
- **Export clip** — on click, dynamically `import('mediabunny')` (browser-only,
  keeps it out of the static prerender), build
  `Input({ source: new BlobSource(blob) })` (the File, or `fetch(url)` → Blob),
  run `Conversion.init({ input, output: new Output({ format: new WavOutputFormat(), target: new BufferTarget() }), trim: { start, end } })`,
  `execute()`, then download the WAV Blob + fire `onExport?(blob)`. Disabled +
  progress (`conversion.onProgress`) while running.

Output format: **WAV** (lossless, no extra encoder dependency).

`registry.json`: add `mediabunny` to the block's `dependencies`; rebuild.

## Steps

1. Update the block (file picker + export) ; add `mediabunny` to registry deps;
   `pnpm registry:build`.
   verify: `public/r/audio-trimmer.json` lists `mediabunny`; emitted source has
   the export logic.
2. `pnpm lint` + `pnpm build`.
   verify: green; `/blocks/view/audio-trimmer` still prerenders (dynamic import
   keeps mediabunny client-only).
3. Smoke-test the dev block: select a range, Export → a trimmed `.wav` downloads.

## Result

`registry/ikui/blocks/audio-trimmer.tsx` now does real trimming:

- **Load audio** picker (`input[type=file] accept="audio/*"`, object-URL managed)
  alongside the default sample; switching the source resets duration/selection.
- **Export clip** dynamically `import('mediabunny')` (client-only — keeps it out
  of the static prerender), builds `Input(BlobSource(file | fetched blob))` →
  `Conversion.init({ output: Output(WavOutputFormat, BufferTarget), trim: { start, end } })`
  → `execute()`, downloads the trimmed WAV + fires `onExport?(blob)`; disabled +
  `conversion.onProgress` percentage while running.
- `registry.json`: block `dependencies` gains `mediabunny`;
  `public/r/audio-trimmer.json` re-emitted (installable with the dep).

mediabunny `1.46.0` (already installed). Confirmed via context7 that
`Conversion({ trim: { start, end } })` + `WavOutputFormat` is the first-class
trim API; bycut already ships mediabunny. `pnpm lint` clean; `pnpm build`
EXIT=0; `/blocks/view/audio-trimmer` still prerenders. Type fix: replaced
`file ?? (await fetch…)` (inferred `Blob | null`) with an explicit if/else.

Not browser-verified end-to-end (WebCodecs decode + download need a real
browser); API matches the official docs and the build/types are green.

### Follow-ups (trimmer UX + primitive fix)

- Redesigned the trimmer track so trimming no longer windows/hides the waveform:
  the **full waveform stays visible**, the trimmed-away regions are dimmed
  (scrim) instead of hidden, and the selection is a transparent framed window
  (border + handles only) — you can see what is being cut and whether there is
  audio there.
- Fixed a `timeline-element` primitive bug: its selection border + trim handles
  were hardcoded **white** (`rgba(255,255,255,…)`), invisible on light tracks.
  Switched to theme tokens — border + handle bar `var(--primary)`, grip
  `var(--primary-foreground)` — matching bycut's `border-primary`/`bg-primary`.
  Theme-aware now; affects all `timeline-element` consumers (improvement).

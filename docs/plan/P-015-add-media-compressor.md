# P-015 — Add media-compressor block (audio/video, mediabunny)

Status: completed
Task: T-015

## Goal

A new Blocks composition that **compresses** audio or video in the browser via
mediabunny's `Conversion` re-encoding options (resolution + bitrate), as a
counterpart to the existing trimmer blocks (which only cut, never re-encode).
One unified block detects whether the loaded file is audio or video and shows the
relevant controls.

## Proposal

`registry/ikui/blocks/media-compressor.tsx` (`registry:block`, `category: blocks`):

- **Load media** — file picker `accept="audio/*,video/*"`; defaults to the shared
  sample video URL. Detect kind from the file `type` (or the default = video).
- **Quality preset** — `NativeSelect` Low / Medium / High →
  `QUALITY_LOW / QUALITY_MEDIUM / QUALITY_HIGH`.
- **Target resolution** (video only) — Keep / 1080p / 720p / 480p / 360p, applied
  as a max `height` with `fit: 'contain'`.
- **Compress** — dynamic `import('mediabunny')` (client-only, keeps it out of the
  static prerender), `Input(BlobSource(file | fetched blob))` →
  `Conversion.init({ input, output: Output(Mp4OutputFormat, BufferTarget),
  video: { height?, bitrate }, audio: { bitrate } })` → `execute()`. Progress via
  `conversion.onProgress`. Output MP4 (video → H.264+AAC; audio-only → AAC .m4a).
- **Before/after readout** — original size → compressed size, % saved (video also
  shows the resolution change); auto-download the result + fire `onExport?(blob)`.

No timeline primitives reused. `registryDependencies`: button, card,
native-select, skeleton. `dependencies`: lucide-react, mediabunny.

## Steps

1. Write the block. verify: typechecks, self-contained, matches block style.
2. `registry.json`: add the `registry:block` item; `pnpm registry:build`.
   verify: `public/r/media-compressor.json` emitted with the deps.
3. `biome check --write` the new file; `pnpm lint`; `pnpm build`.
   verify: green; `/blocks` lists it; `/blocks/view/media-compressor` prerenders
   (dynamic import keeps mediabunny client-only).

## Result

`registry/ikui/blocks/media-compressor.tsx` — a unified audio/video compressor:

- **Load media** picker (`accept="audio/*,video/*"`, default = sample video). One
  up-front fetch resolves the source to a Blob, `probe()`s its kind + intrinsic
  dimensions via an off-screen media element, so the original size and the
  before/after ratio are always known and the same blob feeds the encoder.
- **Quality** (Low/Medium/High → `QUALITY_LOW/MEDIUM/HIGH`) and, for video only,
  **Resolution** (Keep / 1080p / 720p / 480p / 360p → max `height`, `fit: contain`)
  via a small self-contained inline `<select>` (no extra registry dep).
- **Compress** dynamically `import('mediabunny')` (client-only — keeps it out of
  the static prerender), `Conversion.init({ video?: { height, fit, bitrate },
  audio: { bitrate } })` → `execute()`, downloads the MP4 (video → `.mp4`,
  audio-only → `.m4a`) + fires `onExport?(blob)`; disabled + `onProgress` % while
  running. Footer shows Original → Compressed → Saved %.
- `registry.json`: `registry:block`, `category: blocks`, deps `lucide-react` +
  `mediabunny`, registryDeps `button` / `card` / `skeleton`;
  `public/r/media-compressor.json` emitted.

Decisions vs. the proposal:

- Dropped the `native-select` registryDependency — it is this repo's custom Base
  UI primitive, **not** an official shadcn registry component, so listing it would
  break `npx shadcn add`. Replaced with a minimal inline styled `<select>`,
  keeping the block self-contained and installable.

Follow-up: the audio preview uses the `WaveformPlayer` component (`blob` prop)
instead of a raw `<audio controls>` — same waveform/transport as the
audio-trimmer. Adds the `@ikui/waveform-player` registryDependency and the
`@/components/waveform-player` tsconfig path.

Follow-up: the Quality / Resolution controls use the Base UI `Select`
(`@/components/ui/select`, registryDependency `select`) instead of a native
`<select>`. `Select.Value` shows the raw value by default, so a children render
function maps it to the label (`{(value) => LABEL[value]}`).

`pnpm registry:build` ✓, `pnpm lint` clean, `pnpm build` EXIT=0 —
`/blocks/view/media-compressor` prerenders (dynamic import keeps mediabunny
client-only). Not browser-verified end-to-end (AAC/H.264 WebCodecs encode needs a
real browser; same caveat as the trimmer blocks); the API matches the official
mediabunny compression docs and the build/types are green.

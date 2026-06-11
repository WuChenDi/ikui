# P-004 — Add Examples sections to the 4 docs that lack them

Status: completed
Task: T-004

## Goal

Four component docs have only a hero demo and no `## Examples` section, so the
doc set is still visually inconsistent with `image-crop` / `particle-image` /
`copy-button` (hero + `## Examples` with `###` variants). Add one real,
meaningful example to each. Heroes stay untouched (per request). Examples must
exercise actual props / documented use cases — no fabricated APIs.

## Targets and examples (all props verified against registry source)

- `audio-waveform` → `### Custom bars` — `barWidth` / `gap` / `rounded` /
  `barColor` / `barPlayedColor` + a `progress` split. Local synthesized audio
  (`createSampleBlob`), cheap.
- `waveform-player` → `### Custom colors` — `barColor` / `barPlayedColor`. Local
  synthesized audio, cheap.
- `thumbnail-strip` → `### Windowed sub-range` — `startOffset` + a shorter
  `duration` to window into the middle of the clip (the documented
  "one cache backs multiple sub-ranges" case). Loads the same remote video as
  the hero (one extra decode on the page).
- `segmented-timeline-strip` → `### Single cache, multiple segments` — one
  `VideoThumbnailCache` sliced into N equal segments via `startOffset` (the
  exact scenario in the Usage snippet; the hero uses two separate caches, so the
  two complement each other). Click moves the playhead locally; no `<video>`.

## Steps

1. Add a `demo-*.tsx` per target.
   verify: each renders the documented props only.
2. Add `## Examples` + one `###` before `## Props` in each `doc.mdx`; import the
   new demo.
   verify: `grep '^## '` shows Installation → Usage → Examples → Props.
3. `pnpm lint` + `pnpm build`.
   verify: green; the four pages prerender.

## Result

- Added one `demo-*.tsx` + `## Examples` / `###` per target, heroes untouched:
  - `audio-waveform` → `### Custom bars` (`demo-bars.tsx`).
  - `waveform-player` → `### Custom colors` (`demo-colors.tsx`).
  - `thumbnail-strip` → `### Windowed sub-range` (`demo-window.tsx`).
  - `segmented-timeline-strip` → `### Single cache, multiple segments`
    (`demo-single.tsx`).
- All four docs now read Installation → Usage → Examples → Props, matching
  `image-crop` / `particle-image` / `copy-button`.
- Every example uses only verified, documented props — no fabricated APIs.
- Verified: `pnpm lint` green (106 files); `pnpm build` green — the four
  `/docs/[id]` pages prerender.

# P-018 — Add video-frame-extractor block

Status: completed
Task: T-018

## Goal

A **Blocks** business composition that extracts still frames from a video and
lets the user save them as images — the gap left by the existing video stack
(`video-thumbnail-cache` only decodes downscaled timeline thumbnails;
`thumbnail-strip` / `storyboard-timeline` render frames on a timeline, none
export full-resolution stills).

## Proposal / scope

1. **Block source** `registry/ikui/blocks/video-frame-extractor.tsx` — a
   self-contained `VideoFrameExtractor` (`export default`):
   - Load a video file (`<input type=file>`) or fall back to a sample URL.
   - Read duration + intrinsic size off an off-screen `<video>` element.
   - **Evenly-spaced extraction** of N frames (count select: 4 / 9 / 16) at the
     midpoint of each slice, decoded at **native resolution** with mediabunny
     `VideoSampleSink` (its own decode path, not the downscaling cache).
   - Preview the frames in a responsive grid: each tile shows its timestamp and
     a per-frame download; a "Download all" action saves every frame.
   - Output format select (PNG / JPEG).
   - Revoke frame object URLs on re-extract and unmount.
2. **registry.json** — add the `registry:block` item (`category: "blocks"`,
   `dependencies` = `lucide-react`, `mediabunny`; `registryDependencies` =
   `button`, `card`, `select`, `skeleton`; `meta.iframeHeight`). No primitive
   `@ikui/*` deps, so no new tsconfig paths.
3. `pnpm registry:build` → emits `public/r/video-frame-extractor.json`; the
   `/blocks` landing + `/blocks/view/[name]` route auto-discover it via
   `getBlocks()`. Blocks need no `docs/<name>/` folder.

## Steps

1. Block source + registry.json item; `pnpm registry:build`.
   verify: `public/r/video-frame-extractor.json` emitted with inlined content.
2. `pnpm lint` + `pnpm build`.
   verify: green; `/blocks/view/video-frame-extractor` prerendered.

## Result

Shipped the `video-frame-extractor` block. The final UX moved from the initial
fixed-count grid to a **zoomable timeline**, so frame density follows the zoom.

- `registry/ikui/blocks/video-frame-extractor.tsx` — self-contained
  `VideoFrameExtractor` (`export default`): loads a video (file or sample) and
  builds a `VideoThumbnailCache` for the preview filmstrip. A `timeline-ruler`
  aligned to the real duration sits over a continuous `thumbnail-strip`, split
  into evenly spaced frame cells; a zoom slider (auto-fit on load) sets the
  timeline density, so **the number of extractable frames follows the zoom**
  instead of a fixed count (capped at `MAX_FRAMES`). Each cell reveals a
  download button on hover; "Download all" grabs every frame. Stills are decoded
  on demand at **native resolution** via a fresh dynamic-imported mediabunny
  `VideoSampleSink` → `OffscreenCanvas.convertToBlob` (kept off the downscaled
  preview cache); PNG/JPEG select; the cache is disposed on source switch and
  unmount.
- `registry.json` — added the `registry:block` item (deps `lucide-react`,
  `mediabunny`; registryDependencies `@ikui/thumbnail-strip`,
  `@ikui/timeline-ruler`, `@ikui/video-thumbnail-cache`, `button`, `card`,
  `select`, `scroll-area`, `slider`, `skeleton`; `meta.iframeHeight`).
  `pnpm registry:build` emitted `public/r/video-frame-extractor.json`.
- Verified: `pnpm lint` clean; `pnpm build` green,
  `/blocks/view/video-frame-extractor` prerendered.

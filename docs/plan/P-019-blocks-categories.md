# P-019 — Categorize the Blocks gallery (shadcn-style, option B)

Status: completed
Task: T-019

## Goal

`/blocks` currently stacks every `registry:block` in one full-width column
(`src/app/blocks/page.tsx`). With the catalog growing (6 blocks today) the page
is one long scroll and there is no way to browse by domain. Adopt shadcn's
block-category model (option **B**): tag each block with one or more categories
and add a category-filtered route, so the gallery can be sliced by domain.

## Current state

- `RegistryItem` (`src/lib/types.ts`) has an unused singular `category?: string`;
  no block item sets it. shadcn's own schema uses the plural `categories:
  string[]` (see `tmp/ui/apps/v4/registry.json`), which `shadcn build`
  preserves.
- `getBlocks()` (`src/lib/blocks.ts`) maps items → `Block` with no category
  field; `Block` has `{ name, title, description, iframeHeight }`.
- `/blocks` (`src/app/blocks/page.tsx`) renders all blocks via `BlockViewer`,
  no grouping/filtering.
- `/blocks/view/[name]` is `force-static` + `dynamicParams = false`, params from
  `getBlocks()`. The data path is `getRegistry()` → `import('@/registry.json')`
  (a module import, no runtime fs) — so a new static `/blocks/[category]` route
  stays within the CF/Edge static-export constraints already in force.
- Registry data is sourced from `registry.json`; `pnpm registry:build`
  (`pnpx shadcn build`) regenerates `public/r/*.json` from it. `categories` is a
  first-class shadcn field, so it survives the build untouched.

## Proposal (option B)

1. **Schema** — `src/lib/types.ts`: add `categories?: string[]` to
   `RegistryItem` (shadcn-standard plural; leave the legacy `category?` alone to
   stay surgical).

2. **Data** — `registry.json`: add `categories` to each block item:
   - `video-trimmer`, `video-frame-extractor`, `storyboard-timeline` → `["video"]`
   - `media-compressor` → `["video", "audio"]` (handles both)
   - `audio-trimmer` → `["audio"]`
   - `image-cropper` → `["image"]`

   Then `pnpm registry:build` to refresh `public/r/*`.

3. **Category source** — `src/lib/blocks.ts`:
   - Extend `Block` with `categories: string[]`; map it through in `toBlock`.
   - Export `blockCategories` — the ordered, labelled list driving the nav
     (mirrors shadcn's `registryCategories`):
     ```ts
     export const blockCategories = [
       { slug: 'video', label: 'Video' },
       { slug: 'image', label: 'Image' },
       { slug: 'audio', label: 'Audio' },
     ] as const
     ```
   - Add `getBlocksByCategory(slug)` filtering `getBlocks()` by membership.

4. **Nav component** — `src/components/blocks-nav.tsx`: a small server component
   rendering a tab strip `All | Video | Image | Audio`, links to `/blocks` and
   `/blocks/[slug]`, taking an `active` prop for highlight. Reused by both
   pages. (Server-rendered; no client `usePathname` needed since each page knows
   its own active slug.)

5. **Index page** — `src/app/blocks/page.tsx`: render `<BlocksNav active="all" />`
   under the header; list stays all blocks.

6. **Category route** — `src/app/blocks/[category]/page.tsx`:
   - `force-static`, `dynamicParams = false`.
   - `generateStaticParams` from `blockCategories` slugs.
   - `generateMetadata` per category.
   - Renders `<BlocksNav active={slug} />` + the filtered `BlockViewer` list,
     reusing the same code-highlight pipeline as the index page (extract the
     `blocks → {code, highlightedCode}` mapping into a shared helper to avoid
     duplicating it across the two pages).

   Single-segment `[category]`, not shadcn's `[...categories]` catch-all — we
   never need to intersect multiple slugs.

## Steps

1. Schema + registry.json categories + `pnpm registry:build`.
   verify: `public/r/registry.json` items carry `categories`.
2. `blocks.ts` (`Block.categories`, `blockCategories`, `getBlocksByCategory`) +
   `BlocksNav` + wire index page.
   verify: `/blocks` shows the tab strip; All lists every block.
3. `/blocks/[category]/page.tsx`.
   verify: `pnpm build` prerenders `/blocks/video|image|audio`; each lists only
   its blocks; cross-links work.
4. `pnpm lint` + `pnpm build`.
   verify: green.

## Risks

- `shadcn build` rewriting `registry.json`: `categories` is a schema field, so
  preserved; confirm after step 1.
- Active-state correctness across two pages: covered by the `active` prop.
- Low blast radius — additive; `/blocks/view/[name]` untouched.

## Scope

~2 files changed (`types.ts`, `registry.json`, `blocks.ts`, `blocks/page.tsx`)
+ 2 new files (`blocks-nav.tsx`, `blocks/[category]/page.tsx`). No new deps. No
primitive/`@ikui/*` changes.

## Alternatives

- **A (rejected by user)** — single-page grouping with anchor nav, no new route.
  Lighter, but no shareable per-category URLs; user chose B.
- Reuse legacy singular `category?` instead of plural `categories?` — rejected:
  `category` is already in use as the top-level registry group (`"blocks"` /
  `"image"`), `media-compressor` is genuinely multi-category, and plural matches
  shadcn so `shadcn build` round-trips it safely.

## Result

Shipped option B.

- `src/lib/types.ts` — `RegistryItem.categories?: string[]` (left legacy
  `category?` untouched).
- `registry.json` — tagged the 6 blocks: `audio-trimmer` `["audio"]`;
  `video-trimmer` / `video-frame-extractor` / `storyboard-timeline` `["video"]`;
  `media-compressor` `["video","audio"]`; `image-cropper` `["image"]`. Confirmed
  `pnpm registry:build` (`shadcn build`) preserves `categories` in the source.
- `src/lib/blocks.ts` — `Block.categories`, `blockCategories` (ordered
  slug+label), `getBlocksByCategory()`, and a shared `renderBlocks()` helper
  (extracted from the index page so the two gallery pages don't duplicate the
  code-highlight mapping).
- `src/components/blocks-nav.tsx` — `All | Video | Image | Audio` pill tab
  strip, server-rendered, `active` prop.
- `src/app/blocks/page.tsx` — renders `<BlocksNav active="all" />`; switched to
  `renderBlocks`.
- `src/app/blocks/[category]/page.tsx` — new `force-static` route, params from
  `blockCategories`, filtered list, per-category metadata.
- Verified: `pnpm lint` clean; `pnpm build` green — `/blocks` plus
  `/blocks/video|image|audio` prerendered, `/blocks/view/[name]` unchanged.

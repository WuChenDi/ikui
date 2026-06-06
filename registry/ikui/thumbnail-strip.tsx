"use client";

import * as React from "react";
import type { VideoThumbnailCache } from "@/lib/video-thumbnail-cache";

const ASYNC_LOAD_DEBOUNCE_MS = 150;
const MAX_CANVAS_DIMENSION = 8192;
const RENDER_PADDING_PX = 200;

export interface ThumbnailStripProps {
  /** Cache providing the underlying video frames. */
  cache: VideoThumbnailCache;
  /** Duration of the visible range in seconds. */
  duration: number;
  /** Seconds of video skipped at the start. Useful when one cache backs multiple sub-ranges. Default: 0. */
  startOffset?: number;
  /** Total strip width in CSS pixels. Caller controls zoom by varying this value. */
  totalWidth: number;
  /** Width of each tile in CSS pixels. */
  tileWidth: number;
  /** Strip height (also tile height and canvas height) in CSS pixels. */
  tileHeight: number;
  /**
   * Optional URL of a single thumbnail tiled with `background-repeat: repeat-x`
   * beneath the canvas. Useful as an instant fallback before any tile loads.
   */
  fallbackUrl?: string;
  /** How decoded frames are fit into each tile cell. Default: `"cover"`. */
  objectFit?: "cover" | "contain" | "fill";
  /**
   * Scroll container to virtualize against. If `undefined`, the nearest
   * scrollable ancestor is auto-detected. Pass `null` to use the viewport.
   */
  scrollContainer?: HTMLElement | null;
  className?: string;
  style?: React.CSSProperties;
}

function findScrollContainer(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;
  while (current) {
    if (current.scrollWidth > current.clientWidth + 1) return current;
    current = current.parentElement;
  }
  return null;
}

function drawTile({
  ctx,
  image,
  destX,
  destY,
  destWidth,
  destHeight,
  objectFit,
}: {
  ctx: CanvasRenderingContext2D;
  image: ImageBitmap;
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
  objectFit: "cover" | "contain" | "fill";
}): void {
  if (objectFit === "fill") {
    ctx.drawImage(image, destX, destY, destWidth, destHeight);
    return;
  }

  const sourceAspect = image.width / image.height;
  const destAspect = destWidth / destHeight;

  if (objectFit === "cover") {
    let sx: number;
    let sy: number;
    let sw: number;
    let sh: number;
    if (sourceAspect > destAspect) {
      sh = image.height;
      sw = image.height * destAspect;
      sx = (image.width - sw) / 2;
      sy = 0;
    } else {
      sw = image.width;
      sh = image.width / destAspect;
      sx = 0;
      sy = (image.height - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, destX, destY, destWidth, destHeight);
    return;
  }

  let dw: number;
  let dh: number;
  if (sourceAspect > destAspect) {
    dw = destWidth;
    dh = destWidth / sourceAspect;
  } else {
    dh = destHeight;
    dw = destHeight * sourceAspect;
  }
  const dx = destX + (destWidth - dw) / 2;
  const dy = destY + (destHeight - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
}

const ThumbnailStrip = React.forwardRef<HTMLCanvasElement, ThumbnailStripProps>(
  (
    {
      cache,
      duration,
      startOffset = 0,
      totalWidth,
      tileWidth,
      tileHeight,
      fallbackUrl,
      objectFit = "cover",
      scrollContainer: explicitContainer,
      className,
      style,
    },
    ref,
  ) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const renderIdRef = React.useRef(0);
    const drawIdRef = React.useRef(0);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    const rafRef = React.useRef<number>(0);

    React.useImperativeHandle(
      ref,
      () => canvasRef.current as HTMLCanvasElement,
      [],
    );

    const fallbackStyle = React.useMemo<React.CSSProperties | undefined>(
      () =>
        fallbackUrl
          ? {
              backgroundImage: `url(${fallbackUrl})`,
              backgroundRepeat: "repeat-x",
              backgroundSize: `${tileWidth}px ${tileHeight}px`,
              backgroundPosition: "left top",
            }
          : undefined,
      [fallbackUrl, tileWidth, tileHeight],
    );

    React.useLayoutEffect(() => {
      const renderId = ++renderIdRef.current;
      const wrapper = wrapperRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !canvas) return;
      if (totalWidth <= 0 || tileWidth <= 0) return;

      const container =
        explicitContainer === undefined
          ? findScrollContainer(wrapper)
          : explicitContainer;
      const dpr = window.devicePixelRatio || 1;
      const maxLogicalWidth = Math.floor(MAX_CANVAS_DIMENSION / dpr);
      const secondsPerTile = (tileWidth / totalWidth) * duration;

      const tileToTime = (i: number): number =>
        Math.min(startOffset + i * secondsPerTile, startOffset + duration);

      const draw = () => {
        if (renderId !== renderIdRef.current) return;
        const drawId = ++drawIdRef.current;

        const wrapperRect = wrapper.getBoundingClientRect();
        const containerRect = container
          ? container.getBoundingClientRect()
          : new DOMRect(0, 0, window.innerWidth, window.innerHeight);

        const relativeLeft = containerRect.left - wrapperRect.left;
        const visStart = Math.max(0, relativeLeft - RENDER_PADDING_PX);
        const visEnd = Math.min(
          totalWidth,
          relativeLeft + containerRect.width + RENDER_PADDING_PX,
        );

        const renderWidth = Math.ceil(visEnd - visStart);
        if (renderWidth <= 0) return;

        const cappedWidth = Math.min(renderWidth, maxLogicalWidth);
        const renderStart = visStart;

        const targetW = cappedWidth * dpr;
        const targetH = tileHeight * dpr;
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        canvas.style.width = `${cappedWidth}px`;
        canvas.style.height = `${tileHeight}px`;
        canvas.style.left = `${Math.round(renderStart)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cappedWidth, tileHeight);

        const startTile = Math.floor(renderStart / tileWidth);
        const endTile = Math.ceil(visEnd / tileWidth);
        const tilesNeedingLoad: { id: number; time: number }[] = [];

        for (let i = startTile; i < endTile; i++) {
          const destX = i * tileWidth - renderStart;
          const t = tileToTime(i);
          const exact = cache.getCachedBitmap(t);
          const image = exact ?? cache.getNearestCachedBitmap(t) ?? null;

          if (image) {
            drawTile({
              ctx,
              image,
              destX,
              destY: 0,
              destWidth: tileWidth,
              destHeight: tileHeight,
              objectFit,
            });
          }

          if (!exact) tilesNeedingLoad.push({ id: i, time: t });
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (tilesNeedingLoad.length > 0) {
          debounceRef.current = setTimeout(() => {
            if (
              renderId !== renderIdRef.current ||
              drawId !== drawIdRef.current
            ) {
              return;
            }
            void cache.loadBitmaps({
              times: tilesNeedingLoad,
              onBitmap: ({ id, bitmap }) => {
                if (
                  renderId !== renderIdRef.current ||
                  drawId !== drawIdRef.current
                ) {
                  return;
                }
                const tileIndex = Number(id);
                const destX = tileIndex * tileWidth - renderStart;
                drawTile({
                  ctx,
                  image: bitmap,
                  destX,
                  destY: 0,
                  destWidth: tileWidth,
                  destHeight: tileHeight,
                  objectFit,
                });
              },
            });
          }, ASYNC_LOAD_DEBOUNCE_MS);
        }
      };

      draw();

      const onScroll = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
      };

      container?.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        container?.removeEventListener("scroll", onScroll);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [
      cache,
      duration,
      startOffset,
      totalWidth,
      tileWidth,
      tileHeight,
      objectFit,
      explicitContainer,
    ]);

    return (
      <div
        ref={wrapperRef}
        className={className}
        style={{
          position: "relative",
          width: totalWidth,
          height: tileHeight,
          overflow: "hidden",
          ...style,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            ...fallbackStyle,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  },
);

ThumbnailStrip.displayName = "ThumbnailStrip";

export { ThumbnailStrip };

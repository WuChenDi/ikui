'use client'

import {
  Film,
  ImageIcon,
  Maximize2,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import * as React from 'react'
import { ThumbnailStrip } from '@/components/thumbnail-strip'
import { TimelinePlayhead } from '@/components/timeline-playhead'
import { TimelineRuler } from '@/components/timeline-ruler'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { VideoThumbnailCache } from '@/lib/video-thumbnail-cache'

/** A storyboard shot: a video (duration from metadata) or a still image shown for `duration` seconds. */
export type StoryboardSource =
  | { kind: 'video'; url: string }
  | { kind: 'image'; url: string; duration?: number }

const DEFAULT_IMAGE_DURATION = 3

const SAMPLE_SOURCES: StoryboardSource[] = [
  {
    kind: 'video',
    url: 'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/53e46f7949f0d57b77b0cfe47ecf0301.mp4',
  },
  { kind: 'image', url: '/image-compare/before.png' },
  {
    kind: 'video',
    url: 'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4',
  },
]

const RULER_HEIGHT = 24
const CARD_HEADER_HEIGHT = 22
const STRIP_HEIGHT = 56
const CARD_GAP = 10
const ZOOM_MIN = 0.5
const ZOOM_MAX = 4

type VideoItem = {
  kind: 'video'
  id: string
  url: string
  cache: VideoThumbnailCache
  duration: number
}
type ImageItem = { kind: 'image'; id: string; url: string; duration: number }
type Item = VideoItem | ImageItem

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: Item[] }

function formatTime(seconds: number): string {
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Absolute time -> item index + item-local time. */
function locate(abs: number, durations: number[]) {
  let acc = 0
  for (let i = 0; i < durations.length; i++) {
    if (abs < acc + durations[i] || i === durations.length - 1)
      return { index: i, local: Math.max(0, abs - acc) }
    acc += durations[i]
  }
  return { index: 0, local: 0 }
}

/** Linear slider position (0–1) → exponential zoom, so low values step gently. */
function sliderToZoom(position: number, min: number, max: number): number {
  if (max <= min) return min
  const p = Math.max(0, Math.min(1, position))
  return min * (max / min) ** p
}

/** Inverse of `sliderToZoom`. */
function zoomToSlider(zoom: number, min: number, max: number): number {
  if (max <= min) return 0
  const z = Math.max(min, Math.min(max, zoom))
  return Math.log(z / min) / Math.log(max / min)
}

export interface StoryboardTimelineProps {
  /** Shots to lay out end-to-end — videos and/or still images. Defaults to a built-in sample set (remote demo videos + a local still). */
  sources?: StoryboardSource[]
  /** Base pixels per second at zoom = 1. Default: `50`. */
  pixelsPerSecond?: number
}

export function StoryboardTimeline({
  sources = SAMPLE_SOURCES,
  pixelsPerSecond = 50,
}: StoryboardTimelineProps) {
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' })
  const [currentTime, setCurrentTime] = React.useState(0) // absolute
  const [playing, setPlaying] = React.useState(false)
  const [zoom, setZoom] = React.useState(1)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const pendingSeekRef = React.useRef<number | null>(null)
  const wantsPlayRef = React.useRef(false)
  // Mirror of currentTime so the image-clock rAF loop reads the latest value.
  const currentTimeRef = React.useRef(0)
  currentTimeRef.current = currentTime
  // Auto-fit the zoom once per load, after the width is known.
  const didFitRef = React.useRef(false)
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null)

  // Measure the available width (callback ref re-attaches when the node mounts).
  const measureRef = React.useCallback((el: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect()
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    ro.observe(el)
    resizeObserverRef.current = ro
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let acquired: Item[] = []

    const disposeVideos = (items: Item[]) => {
      for (const it of items) if (it.kind === 'video') it.cache.dispose()
    }

    void (async () => {
      const results = await Promise.allSettled(
        sources.map(async (source, i): Promise<Item> => {
          const id = `${i}-${source.url}`
          if (source.kind === 'image') {
            return {
              kind: 'image',
              id,
              url: source.url,
              duration: source.duration ?? DEFAULT_IMAGE_DURATION,
            }
          }
          const cache = await VideoThumbnailCache.fromUrl(source.url)
          const meta = cache.getMetadata()
          if (!meta) throw new Error('metadata missing after init')
          return {
            kind: 'video',
            id,
            url: source.url,
            cache,
            duration: meta.duration,
          }
        }),
      )

      // Caches that decoded before any rejection still hold ImageBitmaps —
      // dispose them so a partial failure (or unmount) doesn't leak.
      const items = results
        .filter(
          (r): r is PromiseFulfilledResult<Item> => r.status === 'fulfilled',
        )
        .map((r) => r.value)
      const rejected = results.find(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )

      if (cancelled || rejected) {
        disposeVideos(items)
        if (cancelled) return
        const reason = rejected?.reason
        setState({
          kind: 'error',
          message: reason instanceof Error ? reason.message : String(reason),
        })
        return
      }

      acquired = items
      setState({ kind: 'ready', items })
    })()

    return () => {
      cancelled = true
      disposeVideos(acquired)
    }
  }, [sources])

  const durations = React.useMemo(
    () => (state.kind === 'ready' ? state.items.map((it) => it.duration) : []),
    [state],
  )
  const starts = React.useMemo(() => {
    const out: number[] = []
    let acc = 0
    for (const d of durations) {
      out.push(acc)
      acc += d
    }
    return out
  }, [durations])

  const total = durations.reduce((s, d) => s + d, 0)
  const pps = pixelsPerSecond * zoom
  const contentWidth = total * pps
  const { index: currentIndex } = locate(currentTime, durations)

  // Zoom that fits the whole storyboard in the available width.
  const fitZoom =
    total > 0 && containerWidth > 0
      ? Math.min(ZOOM_MAX, containerWidth / (total * pixelsPerSecond))
      : 1
  const minZoom = Math.min(ZOOM_MIN, fitZoom)
  const maxZoom = Math.max(ZOOM_MAX, fitZoom)
  const sliderPos = zoomToSlider(zoom, minZoom, maxZoom)

  // Fit once, when the width and duration first become known.
  React.useEffect(() => {
    if (!total || containerWidth <= 0 || didFitRef.current) return
    setZoom(fitZoom)
    didFitRef.current = true
  }, [total, containerWidth, fitZoom])

  // Video clock: while a video shot is active, the <video> drives currentTime.
  React.useEffect(() => {
    if (state.kind !== 'ready') return
    const active = state.items[currentIndex]
    if (!active || active.kind !== 'video') return
    const video = videoRef.current
    if (!video) return

    const onTime = () =>
      setCurrentTime(starts[currentIndex] + video.currentTime)
    const onPlay = () => setPlaying(true)
    // A natural end fires `pause` then `ended`; don't stop there — let `ended`
    // hand off to the next shot (incl. the image rAF clock). Only a real manual
    // pause (not at the end) should halt playback.
    const onPause = () => {
      if (!video.ended) setPlaying(false)
    }
    const onEnded = () => {
      if (currentIndex < state.items.length - 1) {
        wantsPlayRef.current = true
        pendingSeekRef.current = 0
        setCurrentTime(starts[currentIndex + 1])
      } else {
        setPlaying(false)
      }
    }

    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [state, currentIndex, starts])

  // Image clock: stills have no media element, so advance currentTime by rAF
  // while playing, and hand off to the next shot when the still's time is up.
  React.useEffect(() => {
    if (state.kind !== 'ready') return
    const active = state.items[currentIndex]
    if (!active || !playing || active.kind !== 'image') return
    const localEnd = starts[currentIndex] + active.duration
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const next = currentTimeRef.current + dt
      if (next >= localEnd) {
        if (currentIndex < state.items.length - 1) {
          wantsPlayRef.current = true
          pendingSeekRef.current = 0
          setCurrentTime(starts[currentIndex + 1])
        } else {
          setCurrentTime(localEnd)
          setPlaying(false)
        }
        return
      }
      setCurrentTime(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, currentIndex, state, starts])

  const togglePlay = () => {
    if (state.kind !== 'ready') return
    const active = state.items[currentIndex]
    if (!active) return
    if (active.kind === 'video') {
      const video = videoRef.current
      if (!video) return
      if (video.paused) {
        wantsPlayRef.current = true
        void video.play()
      } else {
        wantsPlayRef.current = false
        video.pause()
      }
    } else {
      setPlaying((p) => {
        const next = !p
        wantsPlayRef.current = next
        return next
      })
    }
  }

  const seek = (abs: number) => {
    const { index, local } = locate(abs, durations)
    setCurrentTime(abs)
    if (state.kind !== 'ready') return
    if (index === currentIndex) {
      const active = state.items[index]
      if (active.kind === 'video') {
        const video = videoRef.current
        if (video) video.currentTime = local
      }
    } else {
      pendingSeekRef.current = local
    }
  }

  const scrubFrom = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    seek(Math.min(total, Math.max(0, (event.clientX - rect.left) / pps)))
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    if (pendingSeekRef.current !== null) {
      video.currentTime = pendingSeekRef.current
      pendingSeekRef.current = null
    }
    if (wantsPlayRef.current) void video.play()
  }

  const applySlider = (next: number) => {
    didFitRef.current = true
    setZoom(sliderToZoom(next, minZoom, maxZoom))
  }
  const stepZoom = (delta: number) => applySlider(sliderPos + delta)
  const fit = () => {
    didFitRef.current = true
    setZoom(fitZoom)
  }

  if (state.kind === 'loading') {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    )
  }
  if (state.kind === 'error') {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-destructive text-sm">
            Failed to load shots: {state.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (state.items.length === 0) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-muted-foreground text-sm">No shots to display.</p>
        </CardContent>
      </Card>
    )
  }

  const trackHeight = CARD_HEADER_HEIGHT + STRIP_HEIGHT
  const stripTileWidth = Math.round((STRIP_HEIGHT * 16) / 9)
  const active = state.items[currentIndex]

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        {active.kind === 'video' ? (
          <video
            key={currentIndex}
            ref={videoRef}
            src={active.url}
            crossOrigin="anonymous"
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            className="h-64 w-full rounded-md bg-black object-contain"
          >
            <track kind="captions" />
          </video>
        ) : (
          // biome-ignore lint/performance/noImgElement: shots take arbitrary / blob URLs, next/image would not fit a copyable block
          <img
            key={currentIndex}
            src={active.url}
            alt={`Shot ${currentIndex + 1}`}
            className="h-64 w-full rounded-md bg-black object-contain"
          />
        )}

        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <span className="text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(total)}
          </span>
          <span className="text-muted-foreground">
            shot {currentIndex + 1} of {state.items.length}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Zoom out"
              onClick={() => stepZoom(-0.1)}
            >
              <ZoomOut />
            </Button>
            <div className="w-28">
              <Slider
                min={0}
                max={100}
                value={[sliderPos * 100]}
                onValueChange={(value) =>
                  applySlider((Array.isArray(value) ? value[0] : value) / 100)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Zoom in"
              onClick={() => stepZoom(0.1)}
            >
              <ZoomIn />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Fit to width"
              onClick={fit}
            >
              <Maximize2 />
            </Button>
            <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
              {Math.max(1, Math.round(sliderPos * 100))}%
            </span>
          </div>
        </div>

        {/* Storyboard timeline — each shot is its own card on a shared ruler. */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div ref={measureRef}>
            <ScrollArea style={{ height: RULER_HEIGHT + 8 + trackHeight + 16 }}>
              <div
                ref={contentRef}
                style={{
                  position: 'relative',
                  width: contentWidth,
                  minWidth: '100%',
                  cursor: 'pointer',
                }}
                onPointerDown={scrubFrom}
              >
                <TimelineRuler
                  duration={total}
                  pixelsPerSecond={pixelsPerSecond}
                  zoom={zoom}
                  height={RULER_HEIGHT}
                />

                <div
                  className="mt-2"
                  style={{
                    position: 'relative',
                    width: contentWidth,
                    height: trackHeight,
                  }}
                >
                  {state.items.map((item, i) => {
                    const slotLeft = starts[i] * pps
                    const slotWidth = item.duration * pps
                    const cardWidth = Math.max(0, slotWidth - CARD_GAP)
                    const isActive = i === currentIndex
                    return (
                      <div
                        key={item.id}
                        className="bg-card overflow-hidden rounded-md border"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: slotLeft + CARD_GAP / 2,
                          width: cardWidth,
                          height: trackHeight,
                          borderColor: isActive
                            ? 'var(--primary)'
                            : 'var(--border)',
                          boxShadow: isActive
                            ? '0 0 0 1px var(--primary)'
                            : undefined,
                        }}
                      >
                        <div
                          className="text-muted-foreground flex items-center gap-1.5 overflow-hidden whitespace-nowrap px-2 text-[11px]"
                          style={{
                            height: CARD_HEADER_HEIGHT,
                            lineHeight: `${CARD_HEADER_HEIGHT}px`,
                          }}
                        >
                          <span className="text-foreground font-medium">
                            Shot {i + 1}
                          </span>
                          <span className="tabular-nums">
                            {formatTime(item.duration)}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1">
                            {item.kind === 'video' ? (
                              <>
                                <Film className="size-3" />
                                video
                              </>
                            ) : (
                              <>
                                <ImageIcon className="size-3" />
                                image
                              </>
                            )}
                          </span>
                        </div>
                        {item.kind === 'video' ? (
                          <ThumbnailStrip
                            cache={item.cache}
                            duration={item.duration}
                            totalWidth={cardWidth}
                            tileWidth={stripTileWidth}
                            tileHeight={STRIP_HEIGHT}
                          />
                        ) : (
                          <div
                            style={{
                              width: cardWidth,
                              height: STRIP_HEIGHT,
                              backgroundImage: `url(${item.url})`,
                              backgroundSize: `${stripTileWidth}px ${STRIP_HEIGHT}px`,
                              backgroundRepeat: 'repeat-x',
                              backgroundPosition: 'left center',
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <TimelinePlayhead
                  currentTime={currentTime}
                  duration={total}
                  pixelsPerSecond={pixelsPerSecond}
                  zoom={zoom}
                  onSeek={seek}
                />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StoryboardTimeline

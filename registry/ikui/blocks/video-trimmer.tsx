'use client'

import {
  Download,
  Loader2,
  Maximize2,
  Pause,
  Play,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import * as React from 'react'
import { ThumbnailStrip } from '@/components/thumbnail-strip'
import type { TimelineElementResize } from '@/components/timeline-element'
import { TimelineElement } from '@/components/timeline-element'
import { TimelinePlayhead } from '@/components/timeline-playhead'
import { TimelineRuler } from '@/components/timeline-ruler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { VideoThumbnailCache } from '@/lib/video-thumbnail-cache'

const SAMPLE_VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'

const ZOOM_MAX = 10
// Floor for the slider so you can always zoom out past fit-to-screen and give
// the trim handles breathing room. Lowered to `fitZoom` when a clip is so long
// it only fits below this — so "Fit" stays reachable. (bycut uses a fixed range.)
const ZOOM_MIN = 0.5
const RULER_HEIGHT = 24
// Matches TimelinePlayhead's knob diameter — the track is padded by half this
// on each side so the knob stays fully visible at either end.
const PLAYHEAD_KNOB = 12

export interface VideoTrimmerProps {
  /** Video to load, visualize and trim. Falls back to a bundled sample. */
  videoUrl?: string
  /** Base pixels per second at zoom = 1. Default: `50`. */
  pixelsPerSecond?: number
  /** Thumbnail track height in CSS px. Default: `64`. */
  height?: number
  /** Fired with the trimmed selection while dragging the handles. */
  onChange?: (selection: TimelineElementResize) => void
  /** Fired with the exported MP4 blob after a trim. */
  onExport?: (blob: Blob) => void
}

/** `mm:ss.s` timestamp, e.g. `00:15.5`. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
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

/** A small labelled, monospaced readout — used in the footer status bar. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-muted-foreground/70 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-foreground text-sm font-medium tabular-nums">
        {value}
      </span>
    </span>
  )
}

/**
 * Video trimmer — a business composition built from the timeline primitives.
 * The thumbnail strip visualizes the frames, drag the clip's handles to set
 * in / out points, play back only the trimmed `[startTime, startTime + duration]`
 * window in the preview, then **export the cut as an MP4** via mediabunny's
 * `Conversion({ trim })`. Zoom + scroll the timeline; load your own video with
 * the picker.
 */
export function VideoTrimmer({
  videoUrl = SAMPLE_VIDEO_URL,
  pixelsPerSecond = 50,
  height = 64,
  onChange,
  onExport,
}: VideoTrimmerProps) {
  // The source: an uploaded file (preferred) or the `videoUrl` prop.
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const src = objectUrl ?? videoUrl

  const [cache, setCache] = React.useState<VideoThumbnailCache | null>(null)
  const [total, setTotal] = React.useState(0)
  const [clip, setClip] = React.useState<TimelineElementResize | null>(null)
  const [time, setTime] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [zoom, setZoom] = React.useState(1)
  const [containerWidth, setContainerWidth] = React.useState(0)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  // Auto-fit the zoom once per source, after the width is known.
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

  // Object URL lifecycle for an uploaded file.
  React.useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [file])

  // Decode the video into a thumbnail cache and read its duration, then reset
  // the selection to the full clip.
  React.useEffect(() => {
    setTotal(0)
    setClip(null)
    setTime(0)
    setPlaying(false)
    setCache(null)
    didFitRef.current = false
    let cancelled = false
    let created: VideoThumbnailCache | null = null
    void VideoThumbnailCache.fromUrl(src)
      .then((c) => {
        if (cancelled) {
          c.dispose()
          return
        }
        created = c
        const meta = c.getMetadata()
        if (!meta) return
        setCache(c)
        setTotal(meta.duration)
        setClip({ startTime: 0, duration: meta.duration })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      created?.dispose()
    }
  }, [src])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video) setTime(video.currentTime)
  }

  // Zoom that fits the whole clip in the available width. Subtract the track
  // padding (half a knob each side) so the filled timeline lands exactly on the
  // viewport edge instead of leaving a sliver of scrollable overflow.
  const fitZoom =
    total > 0 && containerWidth > 0
      ? Math.min(
          ZOOM_MAX,
          (containerWidth - PLAYHEAD_KNOB) / (total * pixelsPerSecond),
        )
      : 1
  const minZoom = Math.min(ZOOM_MIN, fitZoom)
  const maxZoom = Math.max(ZOOM_MAX, fitZoom)

  // Fit once, when the width and duration first become known for a source.
  React.useEffect(() => {
    if (!total || containerWidth <= 0 || didFitRef.current) return
    setZoom(fitZoom)
    didFitRef.current = true
  }, [total, containerWidth, fitZoom])

  const updateClip = (next: TimelineElementResize) => {
    setClip(next)
    onChangeRef.current?.(next)
  }

  // Trim the selected window to an MP4 blob with mediabunny, then download it.
  const exportClip = async () => {
    if (!clip) return
    setExporting(true)
    setProgress(0)
    try {
      const {
        Input,
        Output,
        Conversion,
        BlobSource,
        BufferTarget,
        Mp4OutputFormat,
        ALL_FORMATS,
      } = await import('mediabunny')

      let source: Blob
      if (file) {
        source = file
      } else {
        source = await (await fetch(src)).blob()
      }
      const input = new Input({
        source: new BlobSource(source),
        formats: ALL_FORMATS,
      })
      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      })
      const conversion = await Conversion.init({
        input,
        output,
        trim: { start: clip.startTime, end: clip.startTime + clip.duration },
      })
      conversion.onProgress = setProgress
      await conversion.execute()

      const mp4 = new Blob([output.target.buffer as ArrayBuffer], {
        type: 'video/mp4',
      })
      onExport?.(mp4)

      const name = (file?.name ?? 'video').replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(mp4)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-trimmed.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (!cache || !total || !clip) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
          {/* Preview — the video frame. */}
          <Skeleton className="mx-auto aspect-video w-full max-w-md" />

          {/* Toolbar — play + time on the left, zoom on the right. */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-7 w-44" />
          </div>

          {/* Timeline — ruler over the thumbnail strip. */}
          <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-3">
            <Skeleton className="bg-muted-foreground/15 h-3 w-full" />
            <Skeleton
              className="bg-muted-foreground/15 w-full"
              style={{ height }}
            />
          </div>
        </CardContent>

        {/* Footer — selection stats on the left, actions on the right. */}
        <CardFooter className="gap-6">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardFooter>
      </Card>
    )
  }

  const out = clip.startTime + clip.duration
  const pps = pixelsPerSecond * zoom
  const width = total * pps
  const sliderPos = zoomToSlider(zoom, minZoom, maxZoom)

  const applySlider = (next: number) => {
    didFitRef.current = true
    setZoom(sliderToZoom(next, minZoom, maxZoom))
  }
  const stepZoom = (delta: number) => applySlider(sliderPos + delta)
  const fit = () => {
    didFitRef.current = true
    setZoom(fitZoom)
  }

  const seek = (next: number) => {
    const video = videoRef.current
    if (video) video.currentTime = next
    setTime(next)
  }

  // Click / drag anywhere on the timeline to move the playhead and scrub.
  // Pointer-downs on the playhead and trim handles stop propagation, so those
  // gestures still win over seeking.
  const scrubFrom = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const toTime = (clientX: number) => {
      const rect = el.getBoundingClientRect()
      return Math.min(total, Math.max(0, (clientX - rect.left) / pps))
    }
    seek(toTime(event.clientX))
    const onMove = (e: PointerEvent) => seek(toTime(e.clientX))
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
      setPlaying(false)
      return
    }
    // Restart from the top when parked at the end.
    if (time >= total) {
      video.currentTime = 0
      setTime(0)
    }
    void video.play()
    setPlaying(true)
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        {/* Preview — plays back only the trimmed window. */}
        <div className="bg-muted/30 mx-auto flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            src={src}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Toolbar — transport on the left, zoom + fit on the right. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button
            type="button"
            size="icon-lg"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play selection'}
            className="rounded-full"
          >
            {playing ? <Pause /> : <Play className="translate-x-px" />}
          </Button>

          <span className="text-muted-foreground text-xs tabular-nums">
            <span className="text-foreground font-medium">
              {formatTime(time)}
            </span>{' '}
            / {formatTime(total)}
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

        {/* Timeline — the hero; scrolls horizontally when zoomed past the view. */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div ref={measureRef}>
            <ScrollArea
              style={{ height: RULER_HEIGHT + 8 + height + PLAYHEAD_KNOB + 8 }}
            >
              {/* Pad the scroll content by half a knob on every side so the
                  playhead circle stays fully visible at the start, end and top.
                  The inner track is the positioning origin shared by the ruler,
                  strip and playhead, so they all stay aligned. */}
              <div
                style={{
                  width: width + PLAYHEAD_KNOB,
                  minWidth: '100%',
                  padding: PLAYHEAD_KNOB / 2,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width,
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
                      width,
                      height,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Full thumbnail strip — always visible, so you can see what
                      is being cut away. */}
                    <ThumbnailStrip
                      cache={cache}
                      duration={total}
                      totalWidth={Math.ceil(width)}
                      tileWidth={Math.round((height * 16) / 9)}
                      tileHeight={height}
                    />

                    {/* Spotlight — dim everything outside the selection instead of
                      hiding it. The large spread shadow follows the rounded
                      corners, so the dim hugs the selection frame exactly (no
                      square-vs-rounded notch at the corners). Clipped to the
                      strip band by the parent's overflow. */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: clip.startTime * pps,
                        width: clip.duration * pps,
                        borderRadius: 8,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Selection window — a transparent frame (border + draggable
                      trim handles only) so the thumbnails inside stay visible. */}
                    <TimelineElement
                      startTime={clip.startTime}
                      duration={clip.duration}
                      pixelsPerSecond={pixelsPerSecond}
                      zoom={zoom}
                      height={height}
                      minDuration={0.5}
                      maxEnd={total}
                      selected
                      movable
                      color="transparent"
                      onResize={updateClip}
                    />
                  </div>
                  <TimelinePlayhead
                    currentTime={time}
                    duration={total}
                    pixelsPerSecond={pixelsPerSecond}
                    zoom={zoom}
                    onSeek={seek}
                  />
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      {/* Footer — selection summary on the left, source / export on the right. */}
      <CardFooter className="gap-4">
        <Stat label="In" value={formatTime(clip.startTime)} />
        <Stat label="Out" value={formatTime(out)} />
        <Stat label="Length" value={formatTime(clip.duration)} />

        <div className="ml-auto flex items-center gap-2">
          <Button render={<label />} nativeButton={false} variant="outline">
            <Upload />
            Load video
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) setFile(next)
              }}
            />
          </Button>
          <Button
            type="button"
            onClick={() => void exportClip()}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" />
                {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Download />
                Export clip
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default VideoTrimmer

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
import { TimelinePlayhead } from '@/components/timeline-playhead'
import { TimelineRuler } from '@/components/timeline-ruler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { VideoThumbnailCache } from '@/lib/video-thumbnail-cache'

const SAMPLE_VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'

type Format = 'png' | 'jpeg'

interface SourceMeta {
  blob: Blob
  url: string
  cache: VideoThumbnailCache
  duration: number
  width: number
  height: number
}

const FORMAT_LABEL: Record<Format, string> = { png: 'PNG', jpeg: 'JPEG' }

const STRIP_HEIGHT = 72
const RULER_HEIGHT = 24
const ZOOM_MIN = 0.5
const ZOOM_MAX = 4
// Matches TimelinePlayhead's knob diameter — the track is padded by half this
// on each side so the knob stays fully visible at either end.
const PLAYHEAD_KNOB = 12

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

export interface VideoFrameExtractorProps {
  /** Video to load and extract from. Falls back to a bundled sample. */
  videoUrl?: string
  /** Output image format for downloaded stills. Default: `'png'`. */
  format?: Format
  /** Base pixels per second at zoom = 1 — sets the timeline scale. Default: `50`. */
  pixelsPerSecond?: number
}

/**
 * Video frame extractor — load a video (or use the sample) and grab the still
 * **under the playhead**. A time ruler runs across the top aligned to the real
 * duration; beneath it a continuous filmstrip (mediabunny-decoded thumbnails)
 * carries a playhead that tracks playback. Play/pause lives outside the video —
 * the `<video>` itself has no native controls — so wherever it plays (or you
 * drag the playhead) to, one button saves that exact frame at native
 * resolution. The zoom slider sets how dense the timeline is for fine scrubbing.
 */
export function VideoFrameExtractor({
  videoUrl = SAMPLE_VIDEO_URL,
  format: initialFormat = 'png',
  pixelsPerSecond = 50,
}: VideoFrameExtractorProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [meta, setMeta] = React.useState<SourceMeta | null>(null)
  const [format, setFormat] = React.useState<Format>(initialFormat)
  const [zoom, setZoom] = React.useState(1)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const videoRef = React.useRef<HTMLVideoElement>(null)
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

  // Resolve the source to a Blob (uploaded File or fetched URL), build the
  // thumbnail cache, and read duration + intrinsic size off its metadata. The
  // same blob feeds native-resolution decoding on download. Switching sources
  // disposes the previous cache, rewinds the playhead, and re-arms the auto-fit.
  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    let cache: VideoThumbnailCache | null = null
    setMeta(null)
    setError(null)
    setCurrentTime(0)
    setPlaying(false)
    didFitRef.current = false
    void (async () => {
      try {
        const blob = file ?? (await (await fetch(videoUrl)).blob())
        if (cancelled) return
        cache = new VideoThumbnailCache({ source: blob, thumbnailHeight: 96 })
        const { duration, width, height } = await cache.initialize()
        if (cancelled) {
          cache.dispose()
          return
        }
        if (duration <= 0) throw new Error('no duration')
        objectUrl = URL.createObjectURL(blob)
        setMeta({ blob, url: objectUrl, cache, duration, width, height })
      } catch {
        cache?.dispose()
        if (!cancelled) setError('Could not load the video.')
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      cache?.dispose()
    }
  }, [file, videoUrl])

  // Tile geometry derived from zoom; the filmstrip cells keep the source aspect.
  const aspect =
    meta && meta.width > 0 && meta.height > 0
      ? meta.width / meta.height
      : 16 / 9
  const tileWidth = Math.max(1, Math.round(STRIP_HEIGHT * aspect))
  const pps = pixelsPerSecond * zoom
  const total = meta?.duration ?? 0
  const contentWidth = total * pps

  // Zoom that fits the whole video in the available width. Subtract the track
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
  const sliderPos = zoomToSlider(zoom, minZoom, maxZoom)

  // Fit once, when the width and duration first become known.
  React.useEffect(() => {
    if (!total || containerWidth <= 0 || didFitRef.current) return
    setZoom(fitZoom)
    didFitRef.current = true
  }, [total, containerWidth, fitZoom])

  // While playing, drive the playhead off a rAF loop so it tracks smoothly
  // (the `timeupdate` event only fires a few times a second).
  React.useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => {
      const video = videoRef.current
      if (video) setCurrentTime(video.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const applySlider = (next: number) => {
    didFitRef.current = true
    setZoom(sliderToZoom(next, minZoom, maxZoom))
  }
  const stepZoom = (delta: number) => applySlider(sliderPos + delta)
  const fit = () => {
    didFitRef.current = true
    setZoom(fitZoom)
  }

  // Seek both the playhead and the underlying video (the only way to move the
  // playhead, since the `<video>` exposes no native scrubber).
  const seek = (time: number) => {
    const clamped = Math.min(total, Math.max(0, time))
    setCurrentTime(clamped)
    const video = videoRef.current
    if (video) video.currentTime = clamped
  }

  // Click the ruler / filmstrip to jump the playhead there. The inner track's
  // left edge is time 0, so the pointer x maps straight to a time. (Dragging
  // the playhead knob is handled by TimelinePlayhead itself.)
  const scrubFrom = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    seek((event.clientX - rect.left) / pps)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  // Decode a single timestamp at native resolution and hand back the still. A
  // fresh mediabunny input keeps full-res export off the (downscaled) preview
  // cache.
  const decodeFrame = React.useCallback(
    async (blob: Blob, time: number): Promise<Blob | null> => {
      const { Input, BlobSource, VideoSampleSink, ALL_FORMATS } = await import(
        'mediabunny'
      )
      const input = new Input({
        source: new BlobSource(blob),
        formats: ALL_FORMATS,
      })
      const track = await input.getPrimaryVideoTrack()
      if (!track || !(await track.canDecode())) throw new Error('undecodable')
      const sink = new VideoSampleSink(track)
      const sample = await sink.getSample(time)
      if (!sample) return null
      try {
        const canvas = new OffscreenCanvas(
          sample.codedWidth,
          sample.codedHeight,
        )
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        sample.draw(ctx, 0, 0, sample.codedWidth, sample.codedHeight)
        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        const quality = format === 'jpeg' ? 0.92 : undefined
        return await canvas.convertToBlob({ type: mime, quality })
      } finally {
        sample.close()
      }
    },
    [format],
  )

  const baseName = (file?.name ?? 'video').replace(/\.[^.]+$/, '')
  const save = (blob: Blob, time: number) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}-${time.toFixed(1)}s.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Grab the frame sitting under the playhead, at native resolution.
  const downloadFrame = async () => {
    if (!meta || downloading) return
    setDownloading(true)
    setError(null)
    try {
      const blob = await decodeFrame(meta.blob, currentTime)
      if (blob) save(blob, currentTime)
    } catch {
      setError('Extraction failed — this codec may be unsupported here.')
    } finally {
      setDownloading(false)
    }
  }

  if (!meta) {
    if (error) {
      return (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 pt-(--card-spacing)">
            <p className="text-destructive text-sm">{error}</p>
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
          </CardContent>
        </Card>
      )
    }
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
          <Skeleton className="mx-auto aspect-video w-full max-w-md" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </CardContent>
        <CardFooter className="items-center justify-between gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        <video
          ref={videoRef}
          src={meta.url}
          playsInline
          style={{ aspectRatio: aspect }}
          className="bg-muted/30 mx-auto max-h-64 max-w-full rounded-lg"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(event) =>
            setCurrentTime(event.currentTarget.currentTime)
          }
        />

        {/* Toolbar — transport + format on the left, zoom controls on the right. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button
            type="button"
            size="icon-lg"
            className="rounded-full"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause /> : <Play className="translate-x-px" />}
          </Button>
          <span className="text-muted-foreground text-xs tabular-nums">
            <span className="text-foreground font-medium">
              {formatTime(currentTime)}
            </span>{' '}
            / {formatTime(total)}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Format</span>
            <Select
              value={format}
              disabled={downloading}
              onValueChange={(value) => setFormat(value as Format)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value: Format) => FORMAT_LABEL[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORMAT_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

        {/* Timeline — ruler aligned to the real duration, a continuous filmstrip
            beneath it, and a playhead that tracks playback. Click anywhere to
            jump, or drag the playhead to scrub. */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div ref={measureRef}>
            <ScrollArea
              style={{
                height: RULER_HEIGHT + 8 + STRIP_HEIGHT + PLAYHEAD_KNOB + 8,
              }}
            >
              {/* Pad the scroll content by half a knob on every side so the
                  playhead circle stays fully visible at the start, end and top
                  instead of being clipped by the viewport. The inner track is
                  the positioning origin shared by the ruler, strip and
                  playhead, so they all stay aligned. */}
              <div
                style={{
                  width: contentWidth + PLAYHEAD_KNOB,
                  minWidth: '100%',
                  padding: PLAYHEAD_KNOB / 2,
                  boxSizing: 'border-box',
                }}
              >
                <div
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
                    className="bg-background/40 mt-2 overflow-hidden rounded-md border"
                    style={{
                      position: 'relative',
                      width: contentWidth,
                      height: STRIP_HEIGHT,
                    }}
                  >
                    <ThumbnailStrip
                      cache={meta.cache}
                      duration={total}
                      totalWidth={contentWidth}
                      tileWidth={tileWidth}
                      tileHeight={STRIP_HEIGHT}
                    />
                  </div>

                  <TimelinePlayhead
                    currentTime={currentTime}
                    duration={total}
                    pixelsPerSecond={pixelsPerSecond}
                    zoom={zoom}
                    color="var(--color-primary)"
                    onSeek={seek}
                  />
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>

      <CardFooter className="items-center justify-between gap-2">
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
        <Button type="button" disabled={downloading} onClick={downloadFrame}>
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          Download frame
        </Button>
      </CardFooter>
    </Card>
  )
}

export default VideoFrameExtractor

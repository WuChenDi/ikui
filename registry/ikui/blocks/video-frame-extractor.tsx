'use client'

import {
  Download,
  Loader2,
  Maximize2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import * as React from 'react'
import { ThumbnailStrip } from '@/components/thumbnail-strip'
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
// Cap how many stills the strip resolves to, so a long video at high zoom
// can't ask the decoder for thousands of frames at once.
const MAX_FRAMES = 60

/** `m:ss.s` timestamp for a frame label. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
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
 * Video frame extractor — load a video (or use the sample) and scrub stills off
 * a **zoomable timeline**. A time ruler runs across the top aligned to the real
 * duration; beneath it a continuous filmstrip (mediabunny-decoded thumbnails)
 * is split into evenly spaced frame cells. The zoom slider sets how dense the
 * timeline is, so **the number of extractable frames follows the zoom** instead
 * of a fixed count. Each cell reveals a download button on hover that saves its
 * frame at native resolution, or grab them all at once.
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
  const [downloading, setDownloading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

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
  // disposes the previous cache and re-arms the auto-fit.
  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    let cache: VideoThumbnailCache | null = null
    setMeta(null)
    setError(null)
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

  // Tile geometry + frame layout, all derived from zoom. The filmstrip cells
  // keep the source aspect; the cell count (and thus extractable frames) is
  // however many fit across the zoomed timeline, capped.
  const aspect =
    meta && meta.width > 0 && meta.height > 0
      ? meta.width / meta.height
      : 16 / 9
  const tileWidth = Math.max(1, Math.round(STRIP_HEIGHT * aspect))
  const pps = pixelsPerSecond * zoom
  const total = meta?.duration ?? 0
  const contentWidth = total * pps
  const frameCount = Math.min(
    MAX_FRAMES,
    Math.max(1, Math.round(contentWidth / tileWidth)),
  )
  const slotWidth = frameCount > 0 ? contentWidth / frameCount : 0
  // Each cell's representative still: the midpoint of its time slice.
  const frames = React.useMemo(
    () =>
      Array.from({ length: frameCount }, (_, i) => ({
        index: i,
        time: ((i + 0.5) / frameCount) * total,
      })),
    [frameCount, total],
  )

  // Zoom that fits the whole video in the available width.
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

  const applySlider = (next: number) => {
    didFitRef.current = true
    setZoom(sliderToZoom(next, minZoom, maxZoom))
  }
  const stepZoom = (delta: number) => applySlider(sliderPos + delta)
  const fit = () => {
    didFitRef.current = true
    setZoom(fitZoom)
  }

  // Decode the given times at native resolution and hand back stills. A fresh
  // mediabunny input keeps full-res export off the (downscaled) preview cache.
  const decodeFrames = React.useCallback(
    async (
      blob: Blob,
      times: number[],
      onStep?: (done: number) => void,
    ): Promise<Blob[]> => {
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
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'jpeg' ? 0.92 : undefined
      const out: Blob[] = []
      let done = 0
      // Advance progress per requested timestamp, even when a slot decodes to
      // null or the canvas context is unavailable, so it always reaches 100%.
      for await (const sample of sink.samplesAtTimestamps(times)) {
        try {
          if (sample) {
            const canvas = new OffscreenCanvas(
              sample.codedWidth,
              sample.codedHeight,
            )
            const ctx = canvas.getContext('2d')
            if (ctx) {
              sample.draw(ctx, 0, 0, sample.codedWidth, sample.codedHeight)
              out.push(await canvas.convertToBlob({ type: mime, quality }))
            }
          }
        } finally {
          sample?.close()
        }
        done += 1
        onStep?.(done)
      }
      return out
    },
    [format],
  )

  const baseName = (file?.name ?? 'video').replace(/\.[^.]+$/, '')
  const save = (blob: Blob, index: number) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}-frame-${String(index + 1).padStart(2, '0')}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadOne = async (time: number, index: number) => {
    if (!meta || downloading) return
    setDownloading(true)
    setError(null)
    try {
      const [blob] = await decodeFrames(meta.blob, [time])
      if (blob) save(blob, index)
    } catch {
      setError('Extraction failed — this codec may be unsupported here.')
    } finally {
      setDownloading(false)
    }
  }

  const downloadAll = async () => {
    if (!meta || downloading) return
    setDownloading(true)
    setProgress(0)
    setError(null)
    try {
      const times = frames.map((f) => f.time)
      const blobs = await decodeFrames(meta.blob, times, (done) =>
        setProgress(done / times.length),
      )
      blobs.forEach((blob, i) => save(blob, i))
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
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        <video
          src={meta.url}
          controls
          playsInline
          muted
          style={{ aspectRatio: aspect }}
          className="bg-muted/30 mx-auto max-h-64 max-w-full rounded-lg"
        />

        {/* Toolbar — output format on the left, zoom controls on the right. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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
            beneath it, and evenly spaced frame cells; each reveals a download
            button on hover. */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div ref={measureRef}>
            <ScrollArea
              style={{ height: RULER_HEIGHT + 8 + STRIP_HEIGHT + 16 }}
            >
              <div
                style={{
                  position: 'relative',
                  width: contentWidth,
                  minWidth: '100%',
                }}
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

                  {frames.map((frame) => (
                    <div
                      key={frame.time.toFixed(3)}
                      className="group hover:bg-primary/10 absolute top-0 border-l border-white/30 transition-colors"
                      style={{
                        left: frame.index * slotWidth,
                        width: slotWidth,
                        height: STRIP_HEIGHT,
                      }}
                    >
                      <span className="bg-background/80 text-foreground pointer-events-none absolute bottom-1 left-1 rounded px-1 py-0.5 text-[10px] font-medium tabular-nums">
                        {formatTime(frame.time)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        disabled={downloading}
                        title="Download frame"
                        className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => downloadOne(frame.time, frame.index)}
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </div>
                  ))}
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
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm tabular-nums">
            {frameCount} frame{frameCount === 1 ? '' : 's'}
          </span>
          {downloading ? (
            <span className="text-muted-foreground flex items-center gap-2 text-sm tabular-nums">
              <Loader2 className="size-4 animate-spin" />
              {progress > 0
                ? `Saving… ${Math.round(progress * 100)}%`
                : 'Decoding…'}
            </span>
          ) : (
            <Button type="button" onClick={downloadAll}>
              <Download />
              Download all
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default VideoFrameExtractor

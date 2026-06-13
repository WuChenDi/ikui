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
import { AudioWaveform } from '@/components/audio-waveform'
import type { TimelineElementResize } from '@/components/timeline-element'
import { TimelineElement } from '@/components/timeline-element'
import { TimelinePlayhead } from '@/components/timeline-playhead'
import { TimelineRuler } from '@/components/timeline-ruler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'

const SAMPLE_AUDIO_URL =
  'https://hj-video.zeroaigen.cn/prod/USER/AUDIO/f8f39aefee5a61105e18e1a19b501253.mp3'

const ZOOM_MAX = 10
// Floor for the slider so you can always zoom out past fit-to-screen and give
// the trim handles breathing room. Lowered to `fitZoom` when a clip is so long
// it only fits below this — so "Fit" stays reachable. (bycut uses a fixed range.)
const ZOOM_MIN = 0.5
const RULER_HEIGHT = 24

export interface AudioTrimmerProps {
  /** Audio to load, visualize and trim. Falls back to a bundled sample. */
  audioUrl?: string
  /** Base pixels per second at zoom = 1. Default: `50`. */
  pixelsPerSecond?: number
  /** Track height in CSS px. Default: `56`. */
  height?: number
  /** Fired with the trimmed selection while dragging the handles. */
  onChange?: (selection: TimelineElementResize) => void
  /** Fired with the exported WAV blob after a trim. */
  onExport?: (blob: Blob) => void
}

/** `mm:ss.s` */
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
 * Audio trimmer — a business composition built from the timeline primitives.
 * Drag the clip's handles to set in / out points, play back only the trimmed
 * `[startTime, startTime + duration]` window, then **export the cut as a WAV**
 * via mediabunny's `Conversion({ trim })`. Zoom + scroll the timeline; load your
 * own audio with the picker.
 */
export function AudioTrimmer({
  audioUrl = SAMPLE_AUDIO_URL,
  pixelsPerSecond = 50,
  height = 56,
  onChange,
  onExport,
}: AudioTrimmerProps) {
  // The source: an uploaded file (preferred) or the `audioUrl` prop.
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const src = objectUrl ?? audioUrl

  const [total, setTotal] = React.useState(0)
  const [clip, setClip] = React.useState<TimelineElementResize | null>(null)
  const [time, setTime] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [zoom, setZoom] = React.useState(1)
  const [containerWidth, setContainerWidth] = React.useState(0)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  // Latest selection, read inside the timeupdate listener without re-subscribing.
  const clipRef = React.useRef<TimelineElementResize | null>(null)
  clipRef.current = clip
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

  // Read the duration from metadata and reset the selection to the full clip.
  React.useEffect(() => {
    setTotal(0)
    setClip(null)
    setTime(0)
    setPlaying(false)
    didFitRef.current = false
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = src
    const onMeta = () => {
      setTotal(audio.duration)
      setClip({ startTime: 0, duration: audio.duration })
    }
    audio.addEventListener('loadedmetadata', onMeta)
    return () => audio.removeEventListener('loadedmetadata', onMeta)
  }, [src])

  // Playback element; stop at the selection's out point.
  React.useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio
    const onTime = () => {
      const sel = clipRef.current
      if (sel && audio.currentTime >= sel.startTime + sel.duration) {
        audio.pause()
        audio.currentTime = sel.startTime
        setTime(sel.startTime)
        setPlaying(false)
        return
      }
      setTime(audio.currentTime)
    }
    audio.addEventListener('timeupdate', onTime)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audioRef.current = null
    }
  }, [src])

  // Zoom that fits the whole clip in the available width.
  const fitZoom =
    total > 0 && containerWidth > 0
      ? Math.min(ZOOM_MAX, containerWidth / (total * pixelsPerSecond))
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

  // Trim the selected window to a WAV blob with mediabunny, then download it.
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
        WavOutputFormat,
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
        format: new WavOutputFormat(),
        target: new BufferTarget(),
      })
      const conversion = await Conversion.init({
        input,
        output,
        trim: { start: clip.startTime, end: clip.startTime + clip.duration },
      })
      conversion.onProgress = setProgress
      await conversion.execute()

      const wav = new Blob([output.target.buffer as ArrayBuffer], {
        type: 'audio/wav',
      })
      onExport?.(wav)

      const name = (file?.name ?? 'audio').replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(wav)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-trimmed.wav`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (!total || !clip) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
          {/* Toolbar — play + time on the left, zoom on the right. */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-7 w-44" />
          </div>

          {/* Timeline — ruler over the waveform band. */}
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
    const audio = audioRef.current
    if (audio) audio.currentTime = next
    setTime(next)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    // Replay from the in point when the head is outside the selection.
    if (time < clip.startTime || time >= out) {
      audio.currentTime = clip.startTime
      setTime(clip.startTime)
    }
    void audio.play()
    setPlaying(true)
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
        {/* Toolbar — transport on the left, zoom + fit on the right. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
              title="Fit to screen"
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
            <ScrollArea style={{ height: RULER_HEIGHT + 8 + height + 16 }}>
              <div style={{ position: 'relative', width }}>
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
                  {/* Full waveform — always visible, so you can see what is
                      being cut away (and whether there is audio there). */}
                  <AudioWaveform
                    audioUrl={src}
                    width={Math.ceil(width)}
                    height={height}
                    barColor="rgba(148, 148, 173, 0.55)"
                    barPlayedColor="rgba(129, 140, 248, 0.95)"
                    progress={time / total}
                  />

                  {/* Spotlight — dim everything outside the selection instead of
                      hiding it. The large spread shadow follows the rounded
                      corners, so the dim hugs the selection frame exactly (no
                      square-vs-rounded notch at the corners). Clipped to the
                      waveform band by the parent's overflow. */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: clip.startTime * pps,
                      width: clip.duration * pps,
                      borderRadius: 8,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.2)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Selection window — a transparent frame (border + draggable
                      trim handles only) so the waveform inside stays visible. */}
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
            Load audio
            <input
              type="file"
              accept="audio/*"
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

export default AudioTrimmer

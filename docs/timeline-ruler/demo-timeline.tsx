'use client'

import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import { ThumbnailStrip } from '@/registry/ikui/thumbnail-strip'
import { TimelineElement } from '@/registry/ikui/timeline-element'
import { TimelinePlayhead } from '@/registry/ikui/timeline-playhead'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'

const VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/53e46f7949f0d57b77b0cfe47ecf0301.mp4'

const PPS = 50
const MIN_ZOOM = 0.5
const MAX_ZOOM = 6
const RULER_H = 24
const TRACK_HEIGHT = 56
const TILE_WIDTH = 80

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; cache: VideoThumbnailCache; duration: number }

export function Demo() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [zoom, setZoom] = useState(1)
  const [playhead, setPlayhead] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let acquired: VideoThumbnailCache | null = null

    void VideoThumbnailCache.fromUrl(VIDEO_URL)
      .then((cache) => {
        if (cancelled) {
          cache.dispose()
          return
        }
        acquired = cache
        const meta = cache.getMetadata()
        if (!meta) throw new Error('metadata missing after init')
        setState({ kind: 'ready', cache, duration: meta.duration })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      })

    return () => {
      cancelled = true
      acquired?.dispose()
    }
  }, [])

  const duration = state.kind === 'ready' ? state.duration : 0
  const pps = PPS * zoom
  const contentWidth = duration * pps

  const positionFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPlayhead(Math.min(Math.max((e.clientX - rect.left) / pps, 0), duration))
  }

  if (state.kind === 'loading') {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="ml-auto h-9 w-32" />
        </div>
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    )
  }
  if (state.kind === 'error') {
    return (
      <p className="text-destructive text-sm">
        Failed to load video: {state.message}
      </p>
    )
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          Playhead {playhead.toFixed(2)}s
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5))}
            aria-label="zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="text-muted-foreground w-12 text-center tabular-nums">
            {zoom.toFixed(1)}x
          </span>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5))}
            aria-label="zoom in"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-md border p-3">
        {/* Single shared horizontal scroll container — the ruler and both
            tracks live inside it, so they scroll in lockstep. */}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
          <div
            className="relative cursor-pointer select-none"
            style={{ width: contentWidth, minWidth: '100%' }}
            onPointerDown={positionFromEvent}
          >
            <div className="text-muted-foreground">
              <TimelineRuler
                duration={duration}
                zoom={zoom}
                scrollRef={scrollRef}
                height={RULER_H}
              />
            </div>

            <div
              className="mt-2"
              style={{
                position: 'relative',
                width: contentWidth,
                height: TRACK_HEIGHT,
              }}
            >
              <TimelineElement
                startTime={0}
                duration={duration}
                pixelsPerSecond={PPS}
                zoom={zoom}
                height={TRACK_HEIGHT}
                trimmable={false}
              >
                <ThumbnailStrip
                  cache={state.cache}
                  duration={duration}
                  totalWidth={contentWidth}
                  tileWidth={TILE_WIDTH}
                  tileHeight={TRACK_HEIGHT}
                />
              </TimelineElement>
            </div>

            <div
              className="mt-2"
              style={{
                position: 'relative',
                width: contentWidth,
                height: TRACK_HEIGHT,
              }}
            >
              <TimelineElement
                startTime={0}
                duration={duration}
                pixelsPerSecond={PPS}
                zoom={zoom}
                height={TRACK_HEIGHT}
                color="#7c4ddb"
                trimmable={false}
              >
                <AudioWaveform
                  audioUrl={VIDEO_URL}
                  width={contentWidth}
                  height={TRACK_HEIGHT}
                  progress={duration > 0 ? playhead / duration : 0}
                  barColor="rgba(255,255,255,0.4)"
                  barPlayedColor="rgba(255,255,255,0.95)"
                />
              </TimelineElement>
            </div>

            {/* Playhead spanning the ruler and the tracks. */}
            <TimelinePlayhead
              currentTime={playhead}
              duration={duration}
              pixelsPerSecond={PPS}
              zoom={zoom}
              onSeek={setPlayhead}
            />
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        The ruler is purely a time scale. Here it is embedded above a video
        track (<code>thumbnail-strip</code>) and the real audio waveform of the
        same clip (<code>audio-waveform</code>), all sharing one horizontal
        scrollbar via a single <code>scrollRef</code> — scroll the strip and the
        ruler stays locked to the tracks; zoom in/out and the labels adapt from{' '}
        <code>MM:SS</code> down to per-frame <code>Xf</code> marks. Click to
        move the <code>timeline-playhead</code>, or drag its knob to scrub; the
        waveform colors the played portion up to it. The ruler itself renders no
        media and does not play anything.
      </p>
    </div>
  )
}

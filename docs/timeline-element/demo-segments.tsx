'use client'

import { useEffect, useState } from 'react'
import { ThumbnailStrip } from '@/registry/ikui/thumbnail-strip'
import { TimelineElement } from '@/registry/ikui/timeline-element'
import { TimelinePlayhead } from '@/registry/ikui/timeline-playhead'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'
import { SAMPLE_VIDEO_URL } from './sample'

const PIXELS_PER_SECOND = 50
const TRACK_HEIGHT = 56
const SEGMENT_COUNT = 3

export function Demo() {
  const [video, setVideo] = useState<{
    cache: VideoThumbnailCache
    total: number
  } | null>(null)
  const [active, setActive] = useState(0)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let cancelled = false
    let cache: VideoThumbnailCache | null = null
    void VideoThumbnailCache.fromUrl(SAMPLE_VIDEO_URL)
      .then((c) => {
        if (cancelled) return c.dispose()
        cache = c
        const meta = c.getMetadata()
        if (!meta) throw new Error('metadata missing')
        setVideo({ cache: c, total: meta.duration })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      cache?.dispose()
    }
  }, [])

  if (!video) return null

  const { cache, total } = video
  const width = total * PIXELS_PER_SECOND
  const segmentLength = total / SEGMENT_COUNT

  const seek = (event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const next = (event.clientX - rect.left) / PIXELS_PER_SECOND
    setTime(Math.min(total, Math.max(0, next)))
  }

  return (
    <div className="bg-muted/30 max-w-full overflow-x-auto rounded-md border p-3">
      <div style={{ position: 'relative', width }} onPointerDown={seek}>
        <TimelineRuler
          duration={total}
          pixelsPerSecond={PIXELS_PER_SECOND}
          height={24}
        />
        <div
          className="mt-2"
          style={{ position: 'relative', width, height: TRACK_HEIGHT }}
        >
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
            const start = i * segmentLength
            return (
              <TimelineElement
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length segment split
                key={i}
                startTime={start}
                duration={segmentLength}
                pixelsPerSecond={PIXELS_PER_SECOND}
                height={TRACK_HEIGHT}
                color="#3f6cd4"
                trimmable={false}
                selected={active === i}
                onSelect={() => setActive(i)}
                style={{ opacity: active === i ? 1 : 0.5 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: -start * PIXELS_PER_SECOND,
                  }}
                >
                  <ThumbnailStrip
                    cache={cache}
                    duration={total}
                    totalWidth={Math.ceil(width)}
                    tileWidth={Math.round((TRACK_HEIGHT * 16) / 9)}
                    tileHeight={TRACK_HEIGHT}
                  />
                </div>
              </TimelineElement>
            )
          })}
        </div>
        <TimelinePlayhead
          currentTime={time}
          duration={total}
          pixelsPerSecond={PIXELS_PER_SECOND}
          onSeek={setTime}
        />
      </div>
    </div>
  )
}

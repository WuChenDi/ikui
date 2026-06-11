'use client'

import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { TimelineSegment } from '@/registry/ikui/segmented-timeline-strip'
import { SegmentedTimelineStrip } from '@/registry/ikui/segmented-timeline-strip'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'

const VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/53e46f7949f0d57b77b0cfe47ecf0301.mp4'
const SEGMENT_COUNT = 5

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; cache: VideoThumbnailCache; duration: number }

export function Demo() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    let cancelled = false
    let cache: VideoThumbnailCache | null = null

    void VideoThumbnailCache.fromUrl(VIDEO_URL)
      .then((c) => {
        if (cancelled) {
          c.dispose()
          return
        }
        cache = c
        const meta = c.getMetadata()
        if (!meta) throw new Error('metadata missing after init')
        setState({ kind: 'ready', cache: c, duration: meta.duration })
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
      cache?.dispose()
    }
  }, [])

  const segments = useMemo<TimelineSegment[]>(() => {
    if (state.kind !== 'ready') return []
    const segDur = state.duration / SEGMENT_COUNT
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
      id: i,
      cache: state.cache,
      duration: segDur,
      startOffset: i * segDur,
      label: String(i + 1),
    }))
  }, [state])

  if (state.kind === 'loading') {
    return <Skeleton className="h-16 w-full max-w-2xl rounded-md" />
  }
  if (state.kind === 'error') {
    return (
      <p className="text-destructive text-sm">
        Failed to load video: {state.message}
      </p>
    )
  }

  return (
    <div className="w-full max-w-2xl">
      <SegmentedTimelineStrip
        segments={segments}
        currentIndex={currentIndex}
        currentTime={currentTime}
        onSeek={({ segmentIndex, timeWithinSegment }) => {
          setCurrentIndex(segmentIndex)
          setCurrentTime(timeWithinSegment)
        }}
        className="rounded-md"
      />
    </div>
  )
}

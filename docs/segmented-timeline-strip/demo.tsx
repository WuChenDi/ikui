'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { TimelineSegment } from '@/registry/ikui/segmented-timeline-strip'
import { SegmentedTimelineStrip } from '@/registry/ikui/segmented-timeline-strip'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'

const VIDEO_URLS = [
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/53e46f7949f0d57b77b0cfe47ecf0301.mp4',
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4',
]

interface Clip {
  cache: VideoThumbnailCache
  duration: number
  url: string
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; clips: Clip[] }

export function Demo() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pendingSeekRef = useRef<number | null>(null)
  const wantsPlayRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let acquired: VideoThumbnailCache[] = []

    void Promise.all(VIDEO_URLS.map((url) => VideoThumbnailCache.fromUrl(url)))
      .then((caches) => {
        if (cancelled) {
          for (const c of caches) c.dispose()
          return
        }
        acquired = caches
        const clips: Clip[] = caches.map((cache, i) => {
          const meta = cache.getMetadata()
          if (!meta) throw new Error('metadata missing after init')
          return { cache, duration: meta.duration, url: VIDEO_URLS[i] }
        })
        setState({ kind: 'ready', clips })
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
      for (const c of acquired) c.dispose()
    }
  }, [])

  const segments = useMemo<TimelineSegment[]>(() => {
    if (state.kind !== 'ready') return []
    return state.clips.map((clip, i) => ({
      id: i,
      cache: clip.cache,
      duration: clip.duration,
      label: String(i + 1),
    }))
  }, [state])

  // Critical: depend on state + currentIndex so listeners attach once <video>
  // exists, and re-attach when the clip-swap remounts it (key={currentIndex}).
  useEffect(() => {
    if (state.kind !== 'ready') return
    const video = videoRef.current
    if (!video) return

    const onTime = () => setCurrentTime(video.currentTime)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      if (state.kind !== 'ready') return
      if (currentIndex < state.clips.length - 1) {
        wantsPlayRef.current = true
        pendingSeekRef.current = 0
        setCurrentIndex(currentIndex + 1)
        setCurrentTime(0)
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
  }, [state, currentIndex])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      wantsPlayRef.current = true
      void video.play()
    } else {
      wantsPlayRef.current = false
      video.pause()
    }
  }

  const handleSeek = ({
    segmentIndex,
    timeWithinSegment,
  }: {
    segmentIndex: number
    timeWithinSegment: number
  }) => {
    if (state.kind !== 'ready') return
    if (segmentIndex === currentIndex) {
      const video = videoRef.current
      if (video) video.currentTime = timeWithinSegment
      return
    }
    pendingSeekRef.current = timeWithinSegment
    setCurrentIndex(segmentIndex)
    setCurrentTime(timeWithinSegment)
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

  if (state.kind === 'loading') {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <Skeleton className="h-64 w-full rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
    )
  }
  if (state.kind === 'error') {
    return (
      <p className="text-destructive text-sm">
        Failed to load videos: {state.message}
      </p>
    )
  }

  const totalDuration = state.clips.reduce((s, c) => s + c.duration, 0)
  const elapsedAbsolute =
    state.clips.slice(0, currentIndex).reduce((s, c) => s + c.duration, 0) +
    currentTime

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <video
        key={currentIndex}
        ref={videoRef}
        src={state.clips[currentIndex].url}
        crossOrigin="anonymous"
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        className="h-64 w-full rounded-md bg-black object-contain"
      >
        <track kind="captions" />
      </video>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
          aria-label={playing ? 'pause' : 'play'}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <span className="text-muted-foreground tabular-nums">
          {elapsedAbsolute.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
        <span className="text-muted-foreground">
          clip {currentIndex + 1} of {state.clips.length}
        </span>
      </div>
      <SegmentedTimelineStrip
        segments={segments}
        currentIndex={currentIndex}
        currentTime={currentTime}
        onSeek={handleSeek}
        className="rounded-md"
      />
      <p className="text-muted-foreground text-xs">
        Two real clips, each with its own <code>VideoThumbnailCache</code>.
        Segment widths are proportional to clip duration. Click the strip to
        seek; <code>&lt;video&gt;</code> swaps <code>src</code> when you cross a
        clip boundary and auto-advances on <code>ended</code>.
      </p>
    </div>
  )
}

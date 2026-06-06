'use client'

import { useEffect, useState } from 'react'
import { ThumbnailStrip } from '@/registry/ikui/thumbnail-strip'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'

const VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'
const PIXELS_PER_SECOND = 96
const TILE_WIDTH = 96
const TILE_HEIGHT = 60

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; cache: VideoThumbnailCache; duration: number }

export function Demo() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

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

  if (state.kind === 'loading') {
    return (
      <p className="text-muted-foreground text-sm">
        Decoding video via mediabunny…
      </p>
    )
  }
  if (state.kind === 'error') {
    return (
      <p className="text-destructive text-sm">
        Failed to load video: {state.message}
      </p>
    )
  }

  const totalWidth = Math.ceil(state.duration * PIXELS_PER_SECOND)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="text-muted-foreground text-sm">
        {state.duration.toFixed(1)}s · {PIXELS_PER_SECOND}px/s · {TILE_WIDTH}×
        {TILE_HEIGHT}px tiles · scroll horizontally
      </div>
      <div className="overflow-x-auto rounded-md border">
        <ThumbnailStrip
          cache={state.cache}
          duration={state.duration}
          totalWidth={totalWidth}
          tileWidth={TILE_WIDTH}
          tileHeight={TILE_HEIGHT}
        />
      </div>
    </div>
  )
}

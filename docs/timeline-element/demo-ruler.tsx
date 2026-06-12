'use client'

import { useEffect, useState } from 'react'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import { ThumbnailStrip } from '@/registry/ikui/thumbnail-strip'
import type { TimelineElementResize } from '@/registry/ikui/timeline-element'
import { TimelineElement } from '@/registry/ikui/timeline-element'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'
import { VideoThumbnailCache } from '@/registry/ikui/video-thumbnail-cache'
import { SAMPLE_AUDIO_URL, SAMPLE_VIDEO_URL, useAudioDuration } from './sample'

const PIXELS_PER_SECOND = 50
const TRACK_HEIGHT = 56

type Selected = 'audio' | 'video'

export function Demo() {
  const audioTotal = useAudioDuration(SAMPLE_AUDIO_URL)
  const [video, setVideo] = useState<{
    cache: VideoThumbnailCache
    total: number
  } | null>(null)
  const [audioClip, setAudioClip] = useState<TimelineElementResize | null>(null)
  const [videoClip, setVideoClip] = useState<TimelineElementResize | null>(null)
  const [selected, setSelected] = useState<Selected>('video')

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
        setVideoClip({ startTime: 0, duration: meta.duration })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      cache?.dispose()
    }
  }, [])

  useEffect(() => {
    if (audioTotal) setAudioClip({ startTime: 0, duration: audioTotal })
  }, [audioTotal])

  if (!audioTotal || !audioClip || !video || !videoClip) return null

  const total = Math.max(audioTotal, video.total)
  const width = total * PIXELS_PER_SECOND

  return (
    <div className="bg-muted/30 max-w-full overflow-x-auto rounded-md border p-3">
      <div style={{ width }}>
        <TimelineRuler
          duration={total}
          pixelsPerSecond={PIXELS_PER_SECOND}
          height={24}
        />

        {/* Video track. */}
        <div
          className="mt-2"
          style={{ position: 'relative', width, height: TRACK_HEIGHT }}
        >
          <TimelineElement
            startTime={videoClip.startTime}
            duration={videoClip.duration}
            pixelsPerSecond={PIXELS_PER_SECOND}
            height={TRACK_HEIGHT}
            color="#3f6cd4"
            minDuration={0.5}
            selected={selected === 'video'}
            onSelect={() => setSelected('video')}
            onResize={setVideoClip}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -videoClip.startTime * PIXELS_PER_SECOND,
              }}
            >
              <ThumbnailStrip
                cache={video.cache}
                duration={video.total}
                totalWidth={Math.ceil(video.total * PIXELS_PER_SECOND)}
                tileWidth={Math.round((TRACK_HEIGHT * 16) / 9)}
                tileHeight={TRACK_HEIGHT}
              />
            </div>
          </TimelineElement>
        </div>

        {/* Audio track. */}
        <div
          className="mt-2"
          style={{ position: 'relative', width, height: TRACK_HEIGHT }}
        >
          <TimelineElement
            startTime={audioClip.startTime}
            duration={audioClip.duration}
            pixelsPerSecond={PIXELS_PER_SECOND}
            height={TRACK_HEIGHT}
            minDuration={0.5}
            selected={selected === 'audio'}
            onSelect={() => setSelected('audio')}
            onResize={setAudioClip}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -audioClip.startTime * PIXELS_PER_SECOND,
              }}
            >
              <AudioWaveform
                audioUrl={SAMPLE_AUDIO_URL}
                width={Math.ceil(audioTotal * PIXELS_PER_SECOND)}
                height={TRACK_HEIGHT}
                barColor="rgba(255, 255, 255, 0.85)"
              />
            </div>
          </TimelineElement>
        </div>
      </div>
    </div>
  )
}

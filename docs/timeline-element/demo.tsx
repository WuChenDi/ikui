'use client'

import { useEffect, useState } from 'react'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import type { TimelineElementResize } from '@/registry/ikui/timeline-element'
import { TimelineElement } from '@/registry/ikui/timeline-element'
import { SAMPLE_AUDIO_URL, useAudioDuration } from './sample'

const PIXELS_PER_SECOND = 60

export function Demo() {
  const total = useAudioDuration(SAMPLE_AUDIO_URL)
  const [clip, setClip] = useState<TimelineElementResize | null>(null)

  useEffect(() => {
    if (total) setClip({ startTime: 0, duration: total })
  }, [total])

  if (!total || !clip) return null

  return (
    <div className="w-full max-w-2xl overflow-x-auto">
      <div
        style={{
          position: 'relative',
          width: total * PIXELS_PER_SECOND,
          height: 56,
        }}
      >
        <TimelineElement
          startTime={clip.startTime}
          duration={clip.duration}
          pixelsPerSecond={PIXELS_PER_SECOND}
          minDuration={0.5}
          selected
          onResize={setClip}
        >
          {/* Anchor the full waveform to the timeline; the clip windows it. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -clip.startTime * PIXELS_PER_SECOND,
            }}
          >
            <AudioWaveform
              audioUrl={SAMPLE_AUDIO_URL}
              width={total * PIXELS_PER_SECOND}
              height={56}
              barColor="rgba(255, 255, 255, 0.85)"
            />
          </div>
        </TimelineElement>
      </div>
    </div>
  )
}

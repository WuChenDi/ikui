'use client'

import { useState } from 'react'
import {
  SAMPLE_AUDIO_URL,
  useAudioDuration,
} from '@/docs/timeline-element/sample'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import { TimelineElement } from '@/registry/ikui/timeline-element'
import { TimelinePlayhead } from '@/registry/ikui/timeline-playhead'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'

const PIXELS_PER_SECOND = 50
const TRACK_HEIGHT = 56

export function Demo() {
  const total = useAudioDuration(SAMPLE_AUDIO_URL)
  const [time, setTime] = useState(0)

  if (!total) return null

  const width = total * PIXELS_PER_SECOND
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
          <TimelineElement
            startTime={0}
            duration={total}
            pixelsPerSecond={PIXELS_PER_SECOND}
            height={TRACK_HEIGHT}
            trimmable={false}
          >
            <AudioWaveform
              audioUrl={SAMPLE_AUDIO_URL}
              width={Math.ceil(width)}
              height={TRACK_HEIGHT}
              barColor="rgba(255, 255, 255, 0.85)"
            />
          </TimelineElement>
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

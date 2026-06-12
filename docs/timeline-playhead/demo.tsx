'use client'

import { useState } from 'react'
import { TimelinePlayhead } from '@/registry/ikui/timeline-playhead'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'

const DURATION = 30
const PIXELS_PER_SECOND = 20

export function Demo() {
  const [time, setTime] = useState(6)
  const width = DURATION * PIXELS_PER_SECOND

  // Click anywhere on the timeline to move the playhead (the consumer's job).
  const seek = (event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const next = (event.clientX - rect.left) / PIXELS_PER_SECOND
    setTime(Math.min(DURATION, Math.max(0, next)))
  }

  return (
    <div className="w-full max-w-2xl overflow-x-auto">
      <div style={{ position: 'relative', width }} onPointerDown={seek}>
        <TimelineRuler
          duration={DURATION}
          pixelsPerSecond={PIXELS_PER_SECOND}
          height={28}
        />
        <div className="bg-muted/40 mt-1 rounded" style={{ height: 48 }} />
        <TimelinePlayhead
          currentTime={time}
          duration={DURATION}
          pixelsPerSecond={PIXELS_PER_SECOND}
          onSeek={setTime}
        />
      </div>
      <p className="text-muted-foreground mt-2 text-sm tabular-nums">
        {time.toFixed(2)}s
      </p>
    </div>
  )
}

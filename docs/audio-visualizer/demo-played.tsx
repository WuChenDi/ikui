'use client'

import { useEffect, useMemo, useState } from 'react'
import { AudioVisualizer } from '@/registry/ikui/audio-visualizer'
import { createSampleBlob } from './demo'

const DURATION = 3

export function Demo() {
  const blob = useMemo(() => createSampleBlob(), [])
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const elapsed = ((now - start) / 1000) % DURATION
      setCurrentTime(elapsed)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="w-full max-w-md">
      <AudioVisualizer
        blob={blob}
        height={80}
        barWidth={3}
        gap={1}
        currentTime={currentTime}
        barColor="rgb(212, 212, 212)"
        barPlayedColor="rgb(99, 102, 241)"
      />
    </div>
  )
}

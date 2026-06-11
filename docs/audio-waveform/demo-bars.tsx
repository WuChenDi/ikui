'use client'

import { useEffect, useState } from 'react'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import { createSampleBlob } from './sample-audio'

export function Demo() {
  const [blob, setBlob] = useState<Blob | null>(null)

  useEffect(() => {
    setBlob(createSampleBlob())
  }, [])

  if (!blob) return null

  return (
    <div className="w-full max-w-md">
      <AudioWaveform
        blob={blob}
        height={64}
        barWidth={6}
        gap={3}
        rounded
        progress={0.5}
        barColor="rgb(203, 213, 225)"
        barPlayedColor="rgb(244, 63, 94)"
      />
    </div>
  )
}

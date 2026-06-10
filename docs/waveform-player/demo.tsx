'use client'

import { useEffect, useState } from 'react'
import { createSampleBlob } from '@/docs/audio-waveform/sample-audio'
import { WaveformPlayer } from '@/registry/ikui/waveform-player'

export function Demo() {
  const [blob, setBlob] = useState<Blob | null>(null)

  useEffect(() => {
    setBlob(createSampleBlob())
  }, [])

  if (!blob) return null

  return (
    <div className="w-full max-w-md">
      <WaveformPlayer blob={blob} />
    </div>
  )
}

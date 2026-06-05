'use client'

import { useEffect, useState } from 'react'
import { createSampleBlob } from '@/docs/audio-visualizer/demo'
import { AudioPlayer } from '@/registry/ikui/audio-player'

export function Demo() {
  const [blob, setBlob] = useState<Blob | null>(null)

  useEffect(() => {
    setBlob(createSampleBlob())
  }, [])

  if (!blob) return null

  return (
    <div className="w-full max-w-md">
      <AudioPlayer blob={blob} />
    </div>
  )
}

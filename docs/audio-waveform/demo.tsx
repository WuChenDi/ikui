'use client'

import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AudioWaveform } from '@/registry/ikui/audio-waveform'
import { createSampleBlob } from './sample-audio'

const DURATION = 3
const BASE_PPS = 160
const MIN_ZOOM = 1
const MAX_ZOOM = 6
const HEIGHT = 56

export function Demo() {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [zoom, setZoom] = useState(2)
  const [progress, setProgress] = useState(0.4)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBlob(createSampleBlob())
  }, [])

  if (!blob) return null

  const width = DURATION * BASE_PPS * zoom

  const setFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setProgress(Math.min(Math.max((e.clientX - rect.left) / width, 0), 1))
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {(progress * 100).toFixed(0)}%
        </span>
        <span className="text-muted-foreground/70 text-xs">
          decoded once · drawn at {width}px
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5))}
            aria-label="zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="text-muted-foreground w-12 text-center tabular-nums">
            {zoom.toFixed(1)}x
          </span>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5))}
            aria-label="zoom in"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="bg-muted/40 overflow-x-auto overflow-y-hidden rounded-md border"
      >
        <div
          className="cursor-pointer"
          style={{ width, minWidth: '100%' }}
          onClick={setFromEvent}
        >
          <AudioWaveform
            blob={blob}
            width={width}
            height={HEIGHT}
            progress={progress}
            barColor="rgb(148, 163, 184)"
            barPlayedColor="rgb(99, 102, 241)"
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        A <strong>timeline</strong> waveform: it decodes the audio <em>once</em>
        , then draws at an explicit pixel <code>width</code> — zoom in and it
        widens and scrolls instead of re-fitting, reusing the same cached peaks.
        Click to move the <code>progress</code> split.
      </p>
    </div>
  )
}

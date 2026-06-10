'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TimelineRuler } from '@/registry/ikui/timeline-ruler'

const DURATION = 30
const MIN_ZOOM = 0.5
const MAX_ZOOM = 6

export function Demo() {
  const [zoom, setZoom] = useState(1)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {DURATION}s scale
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

      <div className="bg-muted/30 text-foreground rounded-md border px-2 py-1">
        <TimelineRuler duration={DURATION} zoom={zoom} height={28} />
      </div>

      <p className="text-muted-foreground text-xs">
        Just the scale — a {DURATION}s ruler that owns its horizontal scrollbar.
        Zoom in and out to watch the tick density and labels adapt, from whole
        seconds (<code>MM:SS</code>) down to per-frame <code>Xf</code> marks. A
        playhead, seeking, and tracks are composition concerns the consumer adds
        on top — see the timeline example below.
      </p>
    </div>
  )
}

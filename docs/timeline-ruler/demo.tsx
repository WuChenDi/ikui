'use client'

import { TimelineRuler } from '@/registry/ikui/timeline-ruler'

export function Demo() {
  return (
    <div className="bg-muted/30 text-foreground w-full max-w-2xl rounded-md border px-2 py-1">
      <TimelineRuler duration={30} height={28} />
    </div>
  )
}

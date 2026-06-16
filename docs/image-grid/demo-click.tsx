'use client'

import { useState } from 'react'
import { ImageGrid } from '@/registry/ikui/image-grid'

const images = Array.from({ length: 6 }, (_, i) => ({
  src: `/seed/grid-${i + 1}.webp`,
  alt: '',
}))

export function Demo() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-3">
      <ImageGrid images={images} onImageClick={setSelected} />
      <p className="text-muted-foreground text-sm">
        Selected index: {selected ?? '—'}
      </p>
    </div>
  )
}

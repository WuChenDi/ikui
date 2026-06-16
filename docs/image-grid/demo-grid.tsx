'use client'

import { ImageGrid } from '@/registry/ikui/image-grid'

const images = Array.from({ length: 9 }, (_, i) => ({
  src: `/seed/grid-${i + 1}.webp`,
  alt: '',
}))

export function Demo() {
  return (
    <div className="w-full max-w-[360px]">
      <ImageGrid images={images} gap={6} />
    </div>
  )
}

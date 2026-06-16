'use client'

import { ImageGrid } from '@/registry/ikui/image-grid'

const images = [
  { src: '/seed/grid-1.webp', alt: '' },
  { src: '/seed/grid-2.webp', alt: '' },
  { src: '/seed/grid-3.webp', alt: '' },
  { src: '/seed/grid-4.webp', alt: '' },
]

export function Demo() {
  return (
    <div className="w-full max-w-[360px]">
      <ImageGrid images={images} />
    </div>
  )
}

'use client'

import { ImageCompare } from '@/registry/ikui/image-compare'

export function Demo() {
  return (
    <div className="h-[320px] w-full max-w-[480px] rounded-lg bg-muted">
      <ImageCompare
        fill
        objectFit="contain"
        leftImage="/image-compare/before.png"
        rightImage="/image-compare/after.png"
        leftImageLabel="Before"
        rightImageLabel="After"
      />
    </div>
  )
}

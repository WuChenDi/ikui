'use client'

import { ImageCompare } from '@/registry/ikui/image-compare'

export function Demo() {
  return (
    <div className="w-full max-w-[480px]">
      <ImageCompare
        vertical
        leftImage="/image-compare/before.png"
        rightImage="/image-compare/after.png"
        leftImageLabel="Top"
        rightImageLabel="Bottom"
      />
    </div>
  )
}

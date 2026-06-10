'use client'

import { ImageCompare } from '@/registry/ikui/image-compare'

export function Demo() {
  return (
    <div className="w-full max-w-[480px]">
      <ImageCompare
        leftImage="/image-compare/before.png"
        rightImage="/image-compare/after.png"
      />
    </div>
  )
}

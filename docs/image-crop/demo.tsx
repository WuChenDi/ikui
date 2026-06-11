'use client'

import { useState } from 'react'
import type { Crop } from '@/registry/ikui/image-crop'
import { ImageCrop } from '@/registry/ikui/image-crop'

export function Demo() {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 20,
    y: 20,
    width: 60,
    height: 60,
  })

  return (
    <div className="w-full max-w-[480px]">
      <ImageCrop
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)}
      >
        {/* biome-ignore lint/performance/noImgElement: cropping an arbitrary image source, next/image would not fit */}
        <img src="/image-compare/after.png" alt="Drag to crop" />
      </ImageCrop>
    </div>
  )
}

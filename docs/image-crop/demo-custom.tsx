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
        selectionClassName="border border-dashed border-white"
        handleClassName="size-2.5 rounded-none border border-white bg-black/40 focus:bg-white"
      >
        {/* biome-ignore lint/performance/noImgElement: cropping an arbitrary image source, next/image would not fit */}
        <img
          src="https://hj-img.zeroaigen.cn/prod/USER/IMAGE/aa585c3201eaf54d0ce696484ab4abfb.jpg"
          alt="Drag to crop"
        />
      </ImageCrop>
    </div>
  )
}

'use client'

import type { SyntheticEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Crop, PixelCrop } from '@/registry/ikui/image-crop'
import {
  centerCrop,
  ImageCrop,
  makeAspectCrop,
} from '@/registry/ikui/image-crop'

const ASPECT = 16 / 9

function drawPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const pixelRatio = window.devicePixelRatio

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio)
  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  )
}

export function Demo() {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(
      centerCrop(
        makeAspectCrop({ unit: '%', width: 80 }, ASPECT, width, height),
        width,
        height,
      ),
    )
  }

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop.height &&
      imgRef.current &&
      canvasRef.current
    ) {
      drawPreview(imgRef.current, canvasRef.current, completedCrop)
    }
  }, [completedCrop])

  return (
    <div className="flex w-full max-w-[560px] flex-col items-start gap-4 sm:flex-row">
      <div className="max-w-[360px] flex-1">
        <ImageCrop
          crop={crop}
          aspect={ASPECT}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
        >
          {/* biome-ignore lint/performance/noImgElement: cropping an arbitrary image source, next/image would not fit */}
          <img
            ref={imgRef}
            src="/image-compare/after.png"
            alt="Drag to crop"
            onLoad={onImageLoad}
          />
        </ImageCrop>
      </div>
      {completedCrop ? (
        <canvas
          ref={canvasRef}
          className="h-auto w-full max-w-[180px] rounded-md border border-black/10 dark:border-white/15"
          style={{ aspectRatio: ASPECT }}
        />
      ) : null}
    </div>
  )
}

'use client'

import type { SyntheticEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Crop, PixelCrop } from '@/registry/ikui/image-crop'
import {
  centerCrop,
  ImageCrop,
  makeAspectCrop,
} from '@/registry/ikui/image-crop'

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
  const w = Math.floor(crop.width * scaleX)
  const h = Math.floor(crop.height * scaleY)

  canvas.width = w
  canvas.height = h
  ctx.imageSmoothingQuality = 'high'

  // Clip to a circle so the corners stay transparent — an avatar.
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    w,
    h,
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
        makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
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
          aspect={1}
          circularCrop
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
        >
          {/* biome-ignore lint/performance/noImgElement: cropping an arbitrary image source, next/image would not fit */}
          <img
            ref={imgRef}
            src="https://hj-img.zeroaigen.cn/prod/USER/IMAGE/aa585c3201eaf54d0ce696484ab4abfb.jpg"
            alt="Drag to crop"
            crossOrigin="anonymous"
            onLoad={onImageLoad}
          />
        </ImageCrop>
      </div>
      {completedCrop ? (
        <canvas
          ref={canvasRef}
          className="h-auto w-full max-w-[160px] rounded-full"
        />
      ) : null}
    </div>
  )
}

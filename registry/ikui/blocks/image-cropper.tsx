'use client'

import {
  Circle,
  Download,
  RotateCcw,
  RotateCw,
  Square,
  Undo2,
  Upload,
} from 'lucide-react'
import * as React from 'react'
import type { Crop, PercentCrop, PixelCrop } from '@/components/image-crop'
import {
  centerCrop,
  convertToPixelCrop,
  ImageCrop,
  makeAspectCrop,
} from '@/components/image-crop'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

const SAMPLE_IMAGE_URL =
  'https://hj-img.zeroaigen.cn/prod/USER/IMAGE/aa585c3201eaf54d0ce696484ab4abfb.jpg'

/** Aspect-ratio presets. `undefined` is a free-form crop. */
const ASPECT_RATIOS: { label: string; value: number | undefined }[] = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
]

export interface ImageCropperProps {
  /** Image to load and crop. Falls back to a bundled sample. */
  imageUrl?: string
  /** Reject a crop whose output is narrower than this, in source pixels. */
  minWidth?: number
  /** Reject a crop whose output is shorter than this, in source pixels. */
  minHeight?: number
  /** Reject a crop whose output is wider than this, in source pixels. */
  maxWidth?: number
  /** Reject a crop whose output is taller than this, in source pixels. */
  maxHeight?: number
  /** Fired with the cropped image when it is downloaded. */
  onCrop?: (file: File) => void
}

/** A centered crop at 80% of the shorter side, honoring `aspect` when set. */
function initialCrop(
  aspect: number | undefined,
  width: number,
  height: number,
): PercentCrop {
  const box: PercentCrop = aspect
    ? makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height)
    : { unit: '%', x: 0, y: 0, width: 80, height: 80 }
  return centerCrop(box, width, height)
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

/** Pick an output mime + extension from a source filename, defaulting to JPEG. */
function outputFormat(name: string): { mimeType: string; ext: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const mimeType = MIME_BY_EXT[ext] ?? 'image/jpeg'
  return { mimeType, ext: mimeType === 'image/jpeg' ? 'jpg' : ext }
}

/**
 * Paint `crop` (in displayed-image pixels) from the source image onto `canvas`
 * at full source resolution — so the canvas *is* the cropped picture, both for
 * the live preview (scaled down by CSS) and for the download. When `round`, the
 * paint is clipped to an ellipse, leaving transparent corners for an avatar.
 *
 * `crop.x/y` are reported relative to the media box, whose origin coincides
 * with the top-left of the displayed image, so scaling by the image's own
 * displayed size (not the box) keeps the painted region matched to the
 * on-screen selection even when the image is letterboxed inside the box.
 */
function drawPreview(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: PixelCrop,
  round: boolean,
) {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const w = Math.round(crop.width * scaleX)
  const h = Math.round(crop.height * scaleY)
  if (w <= 0 || h <= 0) return

  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, w, h)
  if (round) {
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.clip()
  }
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

/**
 * Image cropper — a business composition built on the image-crop primitive.
 * Load a picture and frame a crop inline; the selection renders live as a real
 * image in the preview beside it — that preview *is* the cropped result. Switch
 * to a circular avatar crop, rotate the source in 90° steps, or lock the box to
 * an aspect-ratio preset. The crop is rejected unless its output lands inside
 * the `[min, max]` source-pixel bounds — the readout turns red until it does —
 * then it can be downloaded at full resolution.
 */
export function ImageCropper({
  imageUrl = SAMPLE_IMAGE_URL,
  minWidth = 200,
  minHeight = 200,
  maxWidth = 4096,
  maxHeight = 4096,
  onCrop,
}: ImageCropperProps) {
  // The source: an uploaded (or rotated) file (preferred) or the `imageUrl` prop.
  const [file, setFile] = React.useState<File | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const src = objectUrl ?? imageUrl
  const fileName = file?.name ?? 'image.jpg'

  const [aspect, setAspect] = React.useState<number | undefined>(undefined)
  const [round, setRound] = React.useState(false)
  const [crop, setCrop] = React.useState<Crop>()
  const [completed, setCompleted] = React.useState<PixelCrop>()

  const imgRef = React.useRef<HTMLImageElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Object-URL lifecycle for an uploaded/rotated file.
  React.useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [file])

  // Output dimensions in source pixels — what validation and the readout use.
  const img = imgRef.current
  const output =
    completed && img && completed.width > 0
      ? {
          width: Math.round(completed.width * (img.naturalWidth / img.width)),
          height: Math.round(
            completed.height * (img.naturalHeight / img.height),
          ),
        }
      : null

  const error = output
    ? output.width < minWidth || output.height < minHeight
      ? `Too small — minimum ${minWidth}×${minHeight}`
      : output.width > maxWidth || output.height > maxHeight
        ? `Too large — maximum ${maxWidth}×${maxHeight}`
        : null
    : null

  // Repaint the preview canvas whenever the selection or shape changes.
  React.useEffect(() => {
    if (
      canvasRef.current &&
      imgRef.current &&
      completed &&
      completed.width > 0
    ) {
      drawPreview(canvasRef.current, imgRef.current, completed, round)
    }
  }, [completed, round])

  // Seed the crop once the image is laid out, so the box is framed on load.
  const seed = (next: number | undefined, w: number, h: number) => {
    const pc = initialCrop(next, w, h)
    setCrop(pc)
    setCompleted(convertToPixelCrop(pc, w, h))
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    seed(aspect, width, height)
  }

  const reseed = (next: number | undefined) => {
    const el = imgRef.current
    if (el) seed(next, el.width, el.height)
  }

  const changeAspect = (next: number | undefined) => {
    setAspect(next)
    reseed(next)
  }

  // Circle mode is square by definition — lock the aspect to 1:1.
  const changeShape = (next: boolean) => {
    setRound(next)
    if (next) {
      setAspect(1)
      reseed(1)
    }
  }

  // Bake a 90° rotation into the source by feeding back a rotated file, so the
  // crop, preview, and download all keep working against an upright image.
  const rotate = (dir: 'cw' | 'ccw') => {
    const image = imgRef.current
    const w = image?.naturalWidth ?? 0
    const h = image?.naturalHeight ?? 0
    if (!image || !w || !h) return

    const canvas = document.createElement('canvas')
    canvas.width = h
    canvas.height = w
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(((dir === 'cw' ? 1 : -1) * Math.PI) / 2)
    ctx.drawImage(image, -w / 2, -h / 2)

    const { mimeType } = outputFormat(fileName)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setFile(new File([blob], fileName, { type: mimeType }))
        setCompleted(undefined)
      },
      mimeType,
      mimeType === 'image/png' ? 1 : 0.95,
    )
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !completed || error) return
    const { mimeType, ext } = round
      ? { mimeType: 'image/png', ext: 'png' }
      : outputFormat(fileName)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const base = fileName.replace(/\.[^.]+$/, '')
        const cropped = new File([blob], `${base}-cropped.${ext}`, {
          type: mimeType,
        })
        onCrop?.(cropped)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = cropped.name
        a.click()
        URL.revokeObjectURL(url)
      },
      mimeType,
      mimeType === 'image/png' ? 1 : 0.95,
    )
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        <div className="grid gap-4 sm:h-80 sm:grid-cols-[1fr_20rem]">
          {/* Crop area. `min-w-0` lets the 1fr column shrink so the image is
              contained (not clipped) and the dim mask covers all of it. */}
          <div className="bg-muted/40 flex min-h-64 min-w-0 items-center justify-center overflow-hidden rounded-lg p-2 sm:min-h-0">
            <ImageCrop
              crop={crop}
              aspect={aspect}
              circularCrop={round}
              ruleOfThirds={!round}
              minWidth={20}
              minHeight={20}
              onChange={(pixel, percent) => {
                setCrop(percent)
                setCompleted(pixel)
              }}
              className="sm:max-h-[calc(20rem_-_1rem)]"
            >
              {/* biome-ignore lint/performance/noImgElement: registry component, no next/image */}
              <img
                ref={imgRef}
                src={src}
                alt="Crop source"
                crossOrigin="anonymous"
                onLoad={onImageLoad}
              />
            </ImageCrop>
          </div>

          {/* Live preview — the cropped result. */}
          <div className="flex min-h-0 flex-col gap-2">
            <span className="text-muted-foreground/70 text-[10px] font-medium uppercase tracking-wide">
              Preview
            </span>
            <div className="bg-muted/40 flex min-h-48 flex-1 items-center justify-center overflow-hidden rounded-lg p-2">
              <canvas
                ref={canvasRef}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {output && (
              <p
                className={
                  error
                    ? 'text-destructive text-xs leading-tight'
                    : 'text-muted-foreground text-xs leading-tight'
                }
              >
                {error ?? `${output.width}×${output.height}px`}
              </p>
            )}
          </div>
        </div>

        {/* Shape + transforms. */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={round ? 'outline' : 'secondary'}
            onClick={() => changeShape(false)}
          >
            <Square />
            Rectangle
          </Button>
          <Button
            size="sm"
            variant={round ? 'secondary' : 'outline'}
            onClick={() => changeShape(true)}
          >
            <Circle />
            Circle
          </Button>

          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="Rotate left"
              onClick={() => rotate('ccw')}
            >
              <RotateCcw />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Rotate right"
              onClick={() => rotate('cw')}
            >
              <RotateCw />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Reset crop"
              onClick={() => reseed(aspect)}
            >
              <Undo2 />
              Reset
            </Button>
          </div>
        </div>

        {/* Aspect presets — irrelevant once the crop is locked to a circle. */}
        {!round && (
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                variant={aspect === value ? 'secondary' : 'outline'}
                onClick={() => changeAspect(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="ml-auto flex items-center gap-2">
          <Button render={<label />} nativeButton={false} variant="outline">
            <Upload />
            Load
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) {
                  setFile(next)
                  setCompleted(undefined)
                }
              }}
            />
          </Button>
          <Button onClick={download} disabled={!completed || !!error}>
            <Download />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ImageCropper

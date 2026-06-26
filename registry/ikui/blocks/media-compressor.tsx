'use client'

import { Download, Loader2, Upload } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { WaveformPlayer } from '@/components/waveform-player'

const SAMPLE_VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'

type Quality = 'low' | 'medium' | 'high'
type Resolution = 'keep' | '1080' | '720' | '480' | '360'

interface SourceMeta {
  blob: Blob
  url: string
  kind: 'audio' | 'video'
  width: number
  height: number
}

export interface MediaCompressorProps {
  /** Media to load and compress. Falls back to a bundled sample video. */
  mediaUrl?: string
  /** Initial quality preset. Default: `'medium'`. */
  quality?: Quality
  /** Fired with the compressed MP4 blob after a run. */
  onExport?: (blob: Blob) => void
}

const QUALITY_LABEL: Record<Quality, string> = {
  low: 'Low — smallest',
  medium: 'Medium — balanced',
  high: 'High — best quality',
}

const RESOLUTION_LABEL: Record<Resolution, string> = {
  keep: 'Keep original',
  '1080': '1080p',
  '720': '720p',
  '480': '480p',
  '360': '360p',
}

/** Human-readable byte size, e.g. `4.2 MB`. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

/** Load a blob's media metadata (kind + intrinsic dimensions) off-screen. */
function probe(
  url: string,
  kind: 'audio' | 'video',
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (kind === 'audio') {
      resolve({ width: 0, height: 0 })
      return
    }
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.src = url
    el.onloadedmetadata = () =>
      resolve({ width: el.videoWidth, height: el.videoHeight })
    el.onerror = () => resolve({ width: 0, height: 0 })
  })
}

/** A small labelled, monospaced readout — used in the footer status bar. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-muted-foreground/70 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-foreground text-sm font-medium tabular-nums">
        {value}
      </span>
    </span>
  )
}

/**
 * Media compressor — a business composition over mediabunny's `Conversion`.
 * Load an audio or video file (or use the sample), pick a quality preset and,
 * for video, a target resolution, then **re-encode to a smaller MP4**: video as
 * H.264 + AAC, audio-only as AAC. The before/after readout shows how much was
 * saved; the result auto-downloads.
 */
export function MediaCompressor({
  mediaUrl = SAMPLE_VIDEO_URL,
  quality: initialQuality = 'medium',
  onExport,
}: MediaCompressorProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [meta, setMeta] = React.useState<SourceMeta | null>(null)
  const [quality, setQuality] = React.useState<Quality>(initialQuality)
  const [resolution, setResolution] = React.useState<Resolution>('keep')
  const [compressing, setCompressing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [result, setResult] = React.useState<{
    size: number
    width: number
    height: number
  } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Resolve the source to a Blob (the uploaded File, or the fetched URL), then
  // probe its kind + dimensions. One fetch up front so the original size and the
  // compression ratio are always known, and the same blob feeds the encoder.
  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setMeta(null)
    setResult(null)
    setError(null)
    setResolution('keep')
    void (async () => {
      try {
        const blob = file ?? (await (await fetch(mediaUrl)).blob())
        if (cancelled) return
        const kind: 'audio' | 'video' = blob.type.startsWith('audio')
          ? 'audio'
          : 'video'
        objectUrl = URL.createObjectURL(blob)
        const { width, height } = await probe(objectUrl, kind)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setMeta({ blob, url: objectUrl, kind, width, height })
      } catch {
        if (!cancelled) setError('Could not load the media.')
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file, mediaUrl])

  // Re-encode the source to a smaller MP4 with mediabunny, then download it.
  const compress = async () => {
    if (!meta) return
    setCompressing(true)
    setProgress(0)
    setError(null)
    setResult(null)
    try {
      const {
        Input,
        Output,
        Conversion,
        BlobSource,
        BufferTarget,
        Mp4OutputFormat,
        ALL_FORMATS,
        QUALITY_LOW,
        QUALITY_MEDIUM,
        QUALITY_HIGH,
      } = await import('mediabunny')

      const bitrate = {
        low: QUALITY_LOW,
        medium: QUALITY_MEDIUM,
        high: QUALITY_HIGH,
      }[quality]
      const targetHeight =
        resolution === 'keep' ? undefined : Number(resolution)

      const input = new Input({
        source: new BlobSource(meta.blob),
        formats: ALL_FORMATS,
      })
      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      })
      const conversion = await Conversion.init({
        input,
        output,
        video:
          meta.kind === 'video'
            ? { height: targetHeight, fit: 'contain', bitrate }
            : undefined,
        audio: { bitrate },
      })
      conversion.onProgress = setProgress
      await conversion.execute()

      const buffer = output.target.buffer as ArrayBuffer
      const mp4 = new Blob([buffer], { type: 'video/mp4' })
      onExport?.(mp4)

      // Output dimensions: target height (contain-scaled width) or the original.
      const outHeight = targetHeight ?? meta.height
      const outWidth =
        targetHeight && meta.height
          ? Math.round((meta.width * targetHeight) / meta.height)
          : meta.width
      setResult({ size: mp4.size, width: outWidth, height: outHeight })

      const ext = meta.kind === 'video' ? 'mp4' : 'm4a'
      const name = (file?.name ?? 'media').replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(mp4)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-compressed.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Compression failed — this codec may be unsupported here.')
    } finally {
      setCompressing(false)
    }
  }

  if (!meta) {
    if (error) {
      return (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 pt-(--card-spacing)">
            <p className="text-destructive text-sm">{error}</p>
            <Button render={<label />} nativeButton={false} variant="outline">
              <Upload />
              Load media
              <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const next = event.target.files?.[0]
                  if (next) setFile(next)
                }}
              />
            </Button>
          </CardContent>
        </Card>
      )
    }
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
          <Skeleton className="mx-auto aspect-video w-full max-w-md" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-8 w-36" />
          </div>
        </CardContent>
        <CardFooter className="gap-6">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardFooter>
      </Card>
    )
  }

  const originalSize = meta.blob.size
  const saved =
    result && originalSize > 0
      ? Math.round((1 - result.size / originalSize) * 100)
      : null

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        {/* Preview — the source media. */}
        {meta.kind === 'video' ? (
          <div className="bg-muted/30 mx-auto flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg">
            <video
              src={meta.url}
              controls
              playsInline
              muted
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-4">
            <WaveformPlayer
              blob={meta.blob}
              barColor="rgba(148, 148, 173, 0.55)"
              barPlayedColor="rgba(129, 140, 248, 0.95)"
            />
          </div>
        )}

        {/* Settings — quality always; resolution for video only. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Quality</span>
            <Select
              value={quality}
              disabled={compressing}
              onValueChange={(value) => setQuality(value as Quality)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value: Quality) => QUALITY_LABEL[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                  <SelectItem key={q} value={q}>
                    {QUALITY_LABEL[q]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {meta.kind === 'video' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Resolution</span>
              <Select
                value={resolution}
                disabled={compressing}
                onValueChange={(value) => setResolution(value as Resolution)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: Resolution) => RESOLUTION_LABEL[value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESOLUTION_LABEL) as Resolution[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESOLUTION_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>

      {/* Footer — before/after readout on the left, source / compress on the right. */}
      <CardFooter className="gap-4">
        <Stat label="Original" value={formatBytes(originalSize)} />
        <Stat
          label="Compressed"
          value={result ? formatBytes(result.size) : '—'}
        />
        <Stat label="Saved" value={saved === null ? '—' : `${saved}%`} />

        <div className="ml-auto flex items-center gap-2">
          <Button render={<label />} nativeButton={false} variant="outline">
            <Upload />
            Load media
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) setFile(next)
              }}
            />
          </Button>
          <Button
            type="button"
            onClick={() => void compress()}
            disabled={compressing}
          >
            {compressing ? (
              <>
                <Loader2 className="animate-spin" />
                {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Download />
                Compress
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default MediaCompressor

'use client'

import { useEffect, useState } from 'react'
import { createSampleBlob } from '@/docs/audio-waveform/sample-audio'
import type { MediaViewerItem } from '@/registry/ikui/media-viewer'
import { MediaViewer } from '@/registry/ikui/media-viewer'

const images = [
  '/seed/grid-1.webp',
  '/seed/grid-2.webp',
  '/seed/grid-3.webp',
  '/seed/grid-4.webp',
  '/seed/grid-5.webp',
]

export function Demo() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>()

  useEffect(() => {
    const url = URL.createObjectURL(createSampleBlob())
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [])

  const items: MediaViewerItem[] = [
    ...images.map((url, i) => ({
      id: i,
      type: 'IMAGE' as const,
      url,
    })),
    ...(audioUrl
      ? [
          {
            id: 'audio',
            type: 'AUDIO' as const,
            url: audioUrl,
            poster: '/seed/grid-6.webp',
          },
        ]
      : []),
  ]

  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setIndex(i)
              setOpen(true)
            }}
            className="relative aspect-square overflow-hidden rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* biome-ignore lint/performance/noImgElement: demo thumbnail */}
            <img
              src={item.type === 'AUDIO' ? (item.poster ?? '') : item.url}
              alt=""
              className="h-full w-full object-cover"
            />
            {item.type === 'AUDIO' && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                Audio
              </span>
            )}
          </button>
        ))}
      </div>
      <MediaViewer
        open={open}
        onOpenChange={setOpen}
        items={items}
        initialIndex={index}
      />
    </div>
  )
}

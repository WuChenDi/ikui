'use client'

import { useEffect, useState } from 'react'

export const SAMPLE_AUDIO_URL =
  'https://cdn.freesound.org/previews/331/331656_5825863-hq.mp3'

export const SAMPLE_VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'

/** Reads an audio file's duration (seconds) from its metadata. `0` until loaded. */
export function useAudioDuration(url: string): number {
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = url
    const onMeta = () => setDuration(audio.duration)
    audio.addEventListener('loadedmetadata', onMeta)
    return () => audio.removeEventListener('loadedmetadata', onMeta)
  }, [url])

  return duration
}

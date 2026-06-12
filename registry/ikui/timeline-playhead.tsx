'use client'

import * as React from 'react'

export interface TimelinePlayheadProps {
  /** Playhead position in seconds. */
  currentTime: number
  /** Total timeline length in seconds — clamps scrubbing. */
  duration: number
  /** Base pixels per second at zoom = 1. Match the ruler's value. Default: `50`. */
  pixelsPerSecond?: number
  /** Zoom multiplier applied to `pixelsPerSecond`. Default: `1`. */
  zoom?: number
  /** Keyboard nudge step in seconds. Default: `0.1`. */
  step?: number
  /** Line and knob color. Default: `"currentColor"`. */
  color?: string
  /** Fired with the new time while dragging the playhead, or on arrow-key nudge. */
  onSeek?: (time: number) => void
  className?: string
  style?: React.CSSProperties
}

export function TimelinePlayhead({
  currentTime,
  duration,
  pixelsPerSecond = 50,
  zoom = 1,
  step = 0.1,
  color = 'currentColor',
  onSeek,
  className,
  style,
}: TimelinePlayheadProps) {
  const pps = pixelsPerSecond * zoom
  const ref = React.useRef<HTMLDivElement>(null)
  const onSeekRef = React.useRef(onSeek)
  onSeekRef.current = onSeek
  const dragging = React.useRef(false)

  React.useEffect(() => {
    const seekFromClientX = (clientX: number) => {
      // The parent is the time-scaled content (width = duration × pps), so its
      // left edge is time 0 — even when scrolled.
      const parent = ref.current?.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const time = Math.min(duration, Math.max(0, (clientX - rect.left) / pps))
      onSeekRef.current?.(time)
    }
    const onMove = (event: PointerEvent) => {
      if (dragging.current) seekFromClientX(event.clientX)
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [pps, duration])

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragging.current = true
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const dir =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (dir === 0) return
    event.preventDefault()
    onSeek?.(Math.min(duration, Math.max(0, currentTime + dir * step)))
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Timeline playhead"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: currentTime * pps,
        width: 2,
        background: color,
        cursor: 'col-resize',
        touchAction: 'none',
        zIndex: 30,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 12,
          height: 12,
          borderRadius: 9999,
          background: color,
        }}
      />
    </div>
  )
}

export default TimelinePlayhead

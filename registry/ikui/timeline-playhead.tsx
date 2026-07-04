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
  const contentWidth = Math.max(0, duration) * pps
  const LINE_WIDTH = 2
  const KNOB_SIZE = 12
  // Keep the 2px line inside the content box at the right edge. The knob stays
  // centred on the line at every position, so its shape never shifts near the
  // ends (it may overhang the edge by half its width — that's intentional).
  const lineLeft = Math.min(
    Math.max(0, currentTime * pps),
    Math.max(0, contentWidth - LINE_WIDTH),
  )
  const ref = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)

  const seekFromClientX = (clientX: number) => {
    // The parent is the time-scaled content (width = duration × pps), so its
    // left edge is time 0 — even when scrolled.
    const parent = ref.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const time = Math.min(duration, Math.max(0, (clientX - rect.left) / pps))
    onSeek?.(time)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    // Capture the pointer so move/up dispatch to the playhead for the drag's
    // duration only — no window listeners kept for the component's whole
    // lifetime — and scrubbing keeps tracking outside the 2px line's bounds.
    event.currentTarget.setPointerCapture(event.pointerId)
    dragging.current = true
  }

  // Only scrubs while a drag is live (guarded by `dragging`); the capture routes
  // moves here even when the pointer leaves the thin line.
  const onPointerMove = (event: React.PointerEvent) => {
    if (dragging.current) seekFromClientX(event.clientX)
  }

  const endDrag = () => {
    dragging.current = false
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
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: lineLeft,
        width: LINE_WIDTH,
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
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: 9999,
          background: color,
        }}
      />
    </div>
  )
}

export default TimelinePlayhead

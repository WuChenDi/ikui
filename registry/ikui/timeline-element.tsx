'use client'

import * as React from 'react'

export interface TimelineElementResize {
  /** New start position in seconds. */
  startTime: number
  /** New visible length in seconds. */
  duration: number
}

export interface TimelineElementProps {
  /** Position on the track in seconds. */
  startTime: number
  /** Visible length in seconds. */
  duration: number
  /** Base pixels per second at zoom = 1. Match the ruler's value. Default: `50`. */
  pixelsPerSecond?: number
  /** Zoom multiplier applied to `pixelsPerSecond`. Default: `1`. */
  zoom?: number
  /** Height in CSS px. Default: `56`. */
  height?: number
  /** Clip fill color. Default: `"#915dbe"`. */
  color?: string
  /** Draws the selection border and (when `trimmable`) the trim handles. */
  selected?: boolean
  /** Show left/right trim handles while selected. Default: `true`. */
  trimmable?: boolean
  /** Minimum duration in seconds while trimming. Default: `0`. */
  minDuration?: number
  /** Keyboard nudge step in seconds. Default: `0.1`. */
  step?: number
  /** Fired on pointer down — select this clip. */
  onSelect?: () => void
  /** Fired continuously while trimming. */
  onResize?: (next: TimelineElementResize) => void
  /** Fired once when a trim drag ends. */
  onResizeEnd?: (next: TimelineElementResize) => void
  /** Clip content — a waveform, thumbnail strip, label, etc. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TimelineElement({
  startTime,
  duration,
  pixelsPerSecond = 50,
  zoom = 1,
  height = 56,
  color = '#915dbe',
  selected = false,
  trimmable = true,
  minDuration = 0,
  step = 0.1,
  onSelect,
  onResize,
  onResizeEnd,
  children,
  className,
  style,
}: TimelineElementProps) {
  const pps = pixelsPerSecond * zoom

  // Live geometry during a drag; falls back to the controlled props otherwise.
  const [live, setLive] = React.useState<TimelineElementResize | null>(null)
  const current = live ?? { startTime, duration }

  const currentRef = React.useRef(current)
  currentRef.current = current
  const onResizeRef = React.useRef(onResize)
  onResizeRef.current = onResize
  const onResizeEndRef = React.useRef(onResizeEnd)
  onResizeEndRef.current = onResizeEnd

  // Resolve a trim delta (seconds) on one side into clamped geometry.
  const trim = React.useCallback(
    (
      side: 'left' | 'right',
      origin: TimelineElementResize,
      dt: number,
    ): TimelineElementResize => {
      if (side === 'left') {
        // left edge moves startTime and duration inversely
        const clamped = Math.min(
          origin.duration - minDuration,
          Math.max(-origin.startTime, dt),
        )
        return {
          startTime: origin.startTime + clamped,
          duration: origin.duration - clamped,
        }
      }
      // right edge changes duration only
      return {
        startTime: origin.startTime,
        duration: Math.max(minDuration, origin.duration + dt),
      }
    },
    [minDuration],
  )

  const dragRef = React.useRef<{
    side: 'left' | 'right'
    startX: number
    origin: TimelineElementResize
  } | null>(null)

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dt = (event.clientX - drag.startX) / pps
      const next = trim(drag.side, drag.origin, dt)
      setLive(next)
      onResizeRef.current?.(next)
    }
    const onUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      onResizeEndRef.current?.(currentRef.current)
      setLive(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [pps, trim])

  const startTrim = (side: 'left' | 'right') => (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      side,
      startX: event.clientX,
      origin: currentRef.current,
    }
  }

  const nudge = (side: 'left' | 'right') => (event: React.KeyboardEvent) => {
    const dir =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (dir === 0) return
    event.preventDefault()
    const next = trim(side, currentRef.current, dir * step)
    onResize?.(next)
    onResizeEnd?.(next)
  }

  // A trim handle: a faint edge bar with a white grip, after a video editor's
  // clip handle. Returned from a plain function (not a nested component) so it
  // keeps its identity across renders and holds focus.
  const renderHandle = (side: 'left' | 'right') => (
    <div
      role="slider"
      tabIndex={0}
      aria-label={side === 'left' ? 'Trim start' : 'Trim end'}
      aria-valuemin={0}
      aria-valuenow={
        side === 'left'
          ? current.startTime
          : current.startTime + current.duration
      }
      onPointerDown={startTrim(side)}
      onKeyDown={nudge(side)}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.18)',
        cursor: side === 'left' ? 'w-resize' : 'e-resize',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          width: 4,
          height: '45%',
          borderRadius: 9999,
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      />
    </div>
  )

  return (
    <div
      onPointerDown={() => onSelect?.()}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: current.startTime * pps,
        width: current.duration * pps,
        height,
        borderRadius: 8,
        overflow: 'hidden',
        background: color,
        cursor: 'pointer',
        touchAction: 'none',
        ...style,
      }}
    >
      {/* Clip content. */}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>

      {/* Selection border. */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.9)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Trim handles. */}
      {selected && trimmable && (
        <>
          {renderHandle('left')}
          {renderHandle('right')}
        </>
      )}
    </div>
  )
}

export default TimelineElement

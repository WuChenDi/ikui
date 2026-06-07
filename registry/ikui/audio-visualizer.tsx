'use client'

import * as React from 'react'

export interface AudioVisualizerDataPoint {
  max: number
  min: number
}

interface AudioVisualizerProps {
  /**
   * Audio blob to visualize.
   */
  blob: Blob
  /**
   * Width of the visualizer. Defaults to the container width.
   */
  width?: number
  /**
   * Height of the visualizer.
   */
  height: number
  /**
   * Width of each individual bar in the visualization. Default: `2`
   */
  barWidth?: number
  /**
   * Gap between each bar in the visualization. Default: `1`
   */
  gap?: number
  /**
   * Background color for the visualization. Default: `"transparent"`
   */
  backgroundColor?: string
  /**
   * Color for the bars that have not yet been played. Default: `"rgb(184, 184, 184)"`
   */
  barColor?: string
  /**
   * Color for the bars that have been played. Default: `"rgb(160, 198, 255)"`
   */
  barPlayedColor?: string
  /**
   * Current timestamp up to which the audio blob has been played. Bars that fall
   * before this time use `barPlayedColor`, the rest use `barColor`.
   */
  currentTime?: number
  /**
   * Custom styles passed to the visualization canvas.
   */
  style?: React.CSSProperties
}

const calculateBarData = (
  buffer: AudioBuffer,
  height: number,
  width: number,
  barWidth: number,
  gap: number,
): AudioVisualizerDataPoint[] => {
  const bufferData = buffer.getChannelData(0)
  const units = width / (barWidth + gap)
  const step = Math.floor(bufferData.length / units)
  const amp = height / 2

  let data: AudioVisualizerDataPoint[] = []
  let maxDataPoint = 0

  for (let i = 0; i < units; i++) {
    const mins: number[] = []
    let minCount = 0
    const maxs: number[] = []
    let maxCount = 0

    for (let j = 0; j < step && i * step + j < buffer.length; j++) {
      const datum = bufferData[i * step + j]
      if (datum <= 0) {
        mins.push(datum)
        minCount++
      }
      if (datum > 0) {
        maxs.push(datum)
        maxCount++
      }
    }
    const minAvg = mins.reduce((a, c) => a + c, 0) / minCount
    const maxAvg = maxs.reduce((a, c) => a + c, 0) / maxCount

    const dataPoint = { max: maxAvg, min: minAvg }

    if (dataPoint.max > maxDataPoint) maxDataPoint = dataPoint.max
    if (Math.abs(dataPoint.min) > maxDataPoint)
      maxDataPoint = Math.abs(dataPoint.min)

    data.push(dataPoint)
  }

  if (amp * 0.8 > maxDataPoint * amp) {
    const adjustmentFactor = (amp * 0.8) / maxDataPoint
    data = data.map((dp) => ({
      max: dp.max * adjustmentFactor,
      min: dp.min * adjustmentFactor,
    }))
  }

  return data
}

const draw = (
  data: AudioVisualizerDataPoint[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number,
  backgroundColor: string,
  barColor: string,
  barPlayedColor?: string,
  currentTime: number = 0,
  duration: number = 1,
): void => {
  const amp = canvas.height / 2

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const playedPercent = (currentTime || 0) / duration

  data.forEach((dp, i) => {
    const mappingPercent = i / data.length
    const played = playedPercent > mappingPercent
    ctx.fillStyle = played && barPlayedColor ? barPlayedColor : barColor

    const x = i * (barWidth + gap)
    const y = amp + dp.min
    const w = barWidth
    const h = amp + dp.max - y

    ctx.beginPath()
    if (ctx.roundRect) {
      // roundRect is not supported in every browser
      ctx.roundRect(x, y, w, h, 50)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, w, h)
    }
  })
}

const AudioVisualizer = React.forwardRef<
  HTMLCanvasElement,
  AudioVisualizerProps
>(
  (
    {
      blob,
      width: widthProp,
      height,
      barWidth = 2,
      gap = 1,
      currentTime,
      style,
      backgroundColor = 'transparent',
      barColor = 'rgb(184, 184, 184)',
      barPlayedColor = 'rgb(160, 198, 255)',
    },
    ref,
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState<number>(widthProp ?? 0)
    const [data, setData] = React.useState<AudioVisualizerDataPoint[]>([])
    const [duration, setDuration] = React.useState<number>(0)

    React.useImperativeHandle(
      ref,
      () => canvasRef.current as HTMLCanvasElement,
      [],
    )

    React.useEffect(() => {
      if (widthProp) return
      if (!containerRef.current) return

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width)
        }
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }, [widthProp])

    React.useEffect(() => {
      // Wait until the width has been resolved.
      if (!width) return

      const audioContext = new AudioContext()

      const processBlob = async () => {
        if (!canvasRef.current) return

        if (!blob) {
          const barsData = Array.from({ length: 100 }, () => ({
            max: 0,
            min: 0,
          }))
          draw(
            barsData,
            canvasRef.current,
            barWidth,
            gap,
            backgroundColor,
            barColor,
            barPlayedColor,
          )
          return
        }

        const audioBuffer = await blob.arrayBuffer()
        await audioContext.decodeAudioData(audioBuffer, (buffer) => {
          if (!canvasRef.current) return
          setDuration(buffer.duration)
          const barsData = calculateBarData(
            buffer,
            height,
            width,
            barWidth,
            gap,
          )
          setData(barsData)
          draw(
            barsData,
            canvasRef.current,
            barWidth,
            gap,
            backgroundColor,
            barColor,
            barPlayedColor,
          )
        })
      }

      void processBlob()

      return () => {
        audioContext.close()
      }
    }, [
      blob,
      width,
      height,
      barPlayedColor,
      backgroundColor,
      barWidth,
      gap,
      barColor,
    ])

    React.useEffect(() => {
      if (!canvasRef.current) return

      draw(
        data,
        canvasRef.current,
        barWidth,
        gap,
        backgroundColor,
        barColor,
        barPlayedColor,
        currentTime,
        duration,
      )
    }, [
      currentTime,
      duration,
      barWidth,
      barColor,
      data,
      gap,
      barPlayedColor,
      backgroundColor,
    ])

    return (
      <div ref={containerRef} style={{ width: widthProp ?? '100%' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ ...style }}
        />
      </div>
    )
  },
)

AudioVisualizer.displayName = 'AudioVisualizer'

export type { AudioVisualizerProps }
export { AudioVisualizer }

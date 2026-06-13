'use client'

import type { MotionValue } from 'motion/react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useMemo, useRef } from 'react'

interface ScrollRevealProps {
  children: string
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
}

export function ScrollReveal({
  children,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end center'],
  })

  const rotate = useTransform(scrollYProgress, [0, 1], [baseRotation, 0])

  const words = useMemo(() => {
    const tokens = children.split(/(\s+)/)
    const total = tokens.filter((t) => !/^\s+$/.test(t)).length
    let index = -1
    return tokens.map((token) => {
      const isSpace = /^\s+$/.test(token)
      if (isSpace) return { token, isSpace, range: [0, 0] as [number, number] }
      index += 1
      const start = index / total
      return {
        token,
        isSpace,
        range: [start, start + 1 / total] as [number, number],
      }
    })
  }, [children])

  return (
    <motion.h2
      ref={containerRef}
      style={{ rotate, transformOrigin: '0% 50%' }}
      className={containerClassName}
    >
      <p className={textClassName}>
        {words.map((word, i) =>
          word.isSpace ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
            <span key={i}>{word.token}</span>
          ) : (
            <Word
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
              key={i}
              progress={scrollYProgress}
              range={word.range}
              baseOpacity={baseOpacity}
              blur={enableBlur ? blurStrength : 0}
            >
              {word.token}
            </Word>
          ),
        )}
      </p>
    </motion.h2>
  )
}

function Word({
  children,
  progress,
  range,
  baseOpacity,
  blur,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
  baseOpacity: number
  blur: number
}) {
  const opacity = useTransform(progress, range, [baseOpacity, 1])
  const filter = useTransform(progress, range, [`blur(${blur}px)`, 'blur(0px)'])

  return (
    <motion.span
      className="inline-block"
      style={{ opacity, filter: blur ? filter : undefined }}
    >
      {children}
    </motion.span>
  )
}

'use client'

import type { Easing } from 'motion/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimatedContentProps {
  children: ReactNode
  distance?: number
  direction?: 'vertical' | 'horizontal'
  reverse?: boolean
  duration?: number
  ease?: Easing
  initialOpacity?: number
  animateOpacity?: boolean
  scale?: number
  threshold?: number
  delay?: number
  className?: string
}

const DEFAULT_EASE: Easing = [0.16, 1, 0.3, 1]

export function AnimatedContent({
  children,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = DEFAULT_EASE,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  className,
}: AnimatedContentProps) {
  const axis = direction === 'horizontal' ? 'x' : 'y'
  const offset = reverse ? -distance : distance

  return (
    <motion.div
      className={className}
      initial={{
        [axis]: offset,
        scale,
        opacity: animateOpacity ? initialOpacity : 1,
      }}
      whileInView={{ [axis]: 0, scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

'use client'

import { ParticleImage } from '@/registry/ikui/particle-image'

export function Demo() {
  return (
    <div className="flex h-[300px] w-[300px] items-center justify-center">
      <ParticleImage
        imageSrc="/ikui/logo.svg"
        canvasWidth="300"
        canvasHeight="300"
        particleGap="2"
        color="#f472b6"
        initPosition="misplaced"
        mouseForce="50"
      />
    </div>
  )
}

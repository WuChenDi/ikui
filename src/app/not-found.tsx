'use client'

import NumberFlow from '@number-flow/react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const [firstDigit, setFirstDigit] = useState(() =>
    Math.floor(Math.random() * 10),
  )
  const [secondDigit, setSecondDigit] = useState(() =>
    Math.floor(Math.random() * 10),
  )
  const [thirdDigit, setThirdDigit] = useState(() =>
    Math.floor(Math.random() * 10),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setFirstDigit((prev) => (prev + 1) % 10)
      setSecondDigit((prev) => (prev + 1) % 10)
      setThirdDigit((prev) => (prev + 1) % 10)
    }, 100)

    const stopTimer = setTimeout(() => {
      clearInterval(interval)

      setFirstDigit(4)
      setTimeout(() => {
        setSecondDigit(0)
      }, 200)
      setTimeout(() => {
        setThirdDigit(4)
      }, 400)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(stopTimer)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6 justify-center items-center h-svh">
      <div className="flex items-start justify-center flex-col gap-8 px-6">
        <div className="flex flex-col gap-12 max-w-[400px]">
          <div className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
            Error
            <div className="flex gap-[0.5px]">
              <NumberFlow value={firstDigit} trend={-1}></NumberFlow>
              <NumberFlow value={secondDigit} trend={-1}></NumberFlow>
              <NumberFlow value={thirdDigit} trend={-1}></NumberFlow>
            </div>
          </div>
          <p className="font-medium font-lg text-muted-foreground">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iure
            ratione sit numquam temporibus beatae explicabo eius quos quia
            voluptatum quae.
          </p>
        </div>
        <Button>
          <Link href={'/'}>
            <ArrowLeft />
            Go Back
          </Link>
        </Button>
      </div>
    </div>
  )
}

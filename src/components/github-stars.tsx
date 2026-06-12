'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { siteConfig } from '@/lib/config'
import { GitHubIcon } from './icons/github'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export function GithubStars() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/github/stars')
      .then((res) => res.json())
      .then((data: { stars: number }) => setStars(data.stars))
      .catch(() => setStars(0))
  }, [])

  const displayValue =
    stars === null
      ? null
      : stars >= 1000
        ? `${(stars / 1000).toFixed(1)}k`
        : stars

  return (
    <Button variant="outline">
      <Link
        href={siteConfig.links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <GitHubIcon className="size-4" />
        {displayValue === null ? (
          <Skeleton className="size-4 rounded-sm" />
        ) : (
          <span className="tabular-nums">{displayValue}</span>
        )}
        <span className="sr-only">Open Github</span>
      </Link>
    </Button>
  )
}

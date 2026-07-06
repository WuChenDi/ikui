import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { GitHubIcon } from './icons/github'
import { Button } from './ui/button'

async function getStars(): Promise<number> {
  const repoPath = siteConfig.links.github.replace('https://github.com/', '')
  try {
    const response = await fetch(`https://ungh.cc/repos/${repoPath}`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return 0
    const data = (await response.json()) as { repo?: { stars?: number } }
    return data.repo?.stars ?? 0
  } catch {
    return 0
  }
}

export async function GithubStars() {
  const stars = await getStars()

  const displayValue = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars

  return (
    <Button variant="outline">
      <Link
        href={siteConfig.links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <GitHubIcon className="size-4" />
        <span className="tabular-nums">{displayValue}</span>
        <span className="sr-only">Open Github</span>
      </Link>
    </Button>
  )
}

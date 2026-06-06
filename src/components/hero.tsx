import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Demo as AudioVisualizerDemo } from '@/docs/audio-visualizer/demo'
import { Demo as CopyButtonDemo } from '@/docs/copy-button/demo'
import { Demo as ThumbnailStripDemo } from '@/docs/thumbnail-strip/demo'

export function Hero() {
  return (
    <div className="flex flex-col items-center w-full pt-6 pb-12 md:pt-14 md:pb-24 gap-8 md:gap-16 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-[700px]">
        <h1 className="font-medium text-3xl md:text-4xl lg:text-5xl tracking-tight">
          Refined UI components for Design Engineers
        </h1>
        <p className="text-base md:text-lg leading-6 text-muted-foreground">
          A collection of high-quality React components that
          <br />
          you can copy and paste into any project.
        </p>
        <div className="flex flex-row gap-3 mt-2 w-auto">
          <Button>
            <Link href={'/docs/introduction'}>Get Started</Link>
          </Button>
          <Button variant="secondary">
            <Link href={'/docs/components'}>Components</Link>
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[900px]">
        <div className="col-span-1 rounded-2xl border shadow-inner min-h-[200px] md:min-h-[240px] flex flex-col p-4">
          <div className="flex-1 flex items-center justify-center">
            <CopyButtonDemo />
          </div>
          <Link
            href="/docs/copy-button"
            className="text-sm leading-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Copy Button
          </Link>
        </div>

        <div className="col-span-1 rounded-2xl border shadow-inner min-h-[200px] md:min-h-[240px] flex flex-col p-4 overflow-hidden">
          <div className="flex-1 flex items-center justify-center w-full">
            <AudioVisualizerDemo />
          </div>
          <Link
            href="/docs/audio-visualizer"
            className="text-sm leading-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Audio Visualizer
          </Link>
        </div>

        <div className="md:col-span-2 rounded-2xl border shadow-inner min-h-[200px] md:min-h-[240px] flex flex-col p-4 overflow-hidden">
          <div className="flex-1 flex items-center justify-center w-full">
            <ThumbnailStripDemo />
          </div>
          <Link
            href="/docs/thumbnail-strip"
            className="text-sm leading-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Thumbnail Strip
          </Link>
        </div>
      </div>
    </div>
  )
}

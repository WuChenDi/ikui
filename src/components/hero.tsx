import Link from 'next/link'
import { BlurText } from '@/components/reactbits/blur-text'
import { GradientText } from '@/components/reactbits/gradient-text'
import { SpotlightCard } from '@/components/reactbits/spotlight-card'
import { Waves } from '@/components/reactbits/waves'
import { Button } from '@/components/ui/button'
import { Demo as CopyButtonDemo } from '@/docs/copy-button/demo'
import { Demo as ImageCompareDemo } from '@/docs/image-compare/demo'
import { Demo as ParticleImageDemo } from '@/docs/particle-image/demo'
import { Demo as ThumbnailStripDemo } from '@/docs/thumbnail-strip/demo'
import { Demo as WaveformPlayerDemo } from '@/docs/waveform-player/demo'

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <Waves
        className="pointer-events-none text-foreground/15 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_75%)]"
        lineColor="currentColor"
        waveAmpX={28}
        waveAmpY={12}
        xGap={12}
        yGap={36}
      />

      <div className="relative z-10 flex w-full flex-col items-center gap-8 px-4 pt-6 pb-12 md:gap-16 md:pt-14 md:pb-24">
        <div className="flex max-w-[760px] flex-col items-center gap-6 text-center">
          <Link href="/docs/introduction" className="group">
            <GradientText
              showBorder
              colors={['#6366f1', '#a855f7', '#ec4899', '#a855f7', '#6366f1']}
              className="border border-border text-xs tracking-wide md:text-sm"
            >
              ✨ Base UI powered · copy &amp; paste components
            </GradientText>
          </Link>

          <h1 className="sr-only">
            Refined UI components for Design Engineers
          </h1>
          <div aria-hidden="true">
            <BlurText
              text="Refined UI components for Design Engineers"
              animateBy="words"
              delay={120}
              className="justify-center text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl"
            />
          </div>

          <p className="text-base leading-6 text-muted-foreground md:text-lg">
            A collection of high-quality React components that
            <br />
            you can copy and paste into any project.
          </p>

          <div className="mt-2 flex w-auto flex-row gap-3">
            <Button>
              <Link href={'/docs/introduction'}>Get Started</Link>
            </Button>
            <Button variant="secondary">
              <Link href={'/docs/components'}>Components</Link>
            </Button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid w-full max-w-[900px] grid-cols-1 gap-4 md:grid-cols-2">
          <SpotlightCard className="col-span-1 flex min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
            <div className="flex flex-1 items-center justify-center">
              <CopyButtonDemo />
            </div>
            <Link
              href="/docs/copy-button"
              className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              Copy Button
            </Link>
          </SpotlightCard>

          <SpotlightCard className="col-span-1 flex min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
            <div className="flex w-full flex-1 items-center justify-center">
              <WaveformPlayerDemo />
            </div>
            <Link
              href="/docs/waveform-player"
              className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              Waveform Player
            </Link>
          </SpotlightCard>

          <SpotlightCard className="col-span-1 flex min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
              <ImageCompareDemo />
            </div>
            <Link
              href="/docs/image-compare"
              className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              Image Compare
            </Link>
          </SpotlightCard>

          <SpotlightCard className="col-span-1 flex min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
              <ParticleImageDemo />
            </div>
            <Link
              href="/docs/particle-image"
              className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              Particle Image
            </Link>
          </SpotlightCard>

          <SpotlightCard className="flex min-h-[200px] flex-col p-4 shadow-inner md:col-span-2 md:min-h-[240px]">
            <div className="flex w-full flex-1 items-center justify-center">
              <ThumbnailStripDemo />
            </div>
            <Link
              href="/docs/thumbnail-strip"
              className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              Thumbnail Strip
            </Link>
          </SpotlightCard>
        </div>
      </div>
    </section>
  )
}

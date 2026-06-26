import Link from 'next/link'
import { AnimatedContent } from '@/components/reactbits/animated-content'
import { BlurText } from '@/components/reactbits/blur-text'
import { GradientText } from '@/components/reactbits/gradient-text'
import { SpotlightCard } from '@/components/reactbits/spotlight-card'
import { Waves } from '@/components/reactbits/waves'
import { Button } from '@/components/ui/button'
import { Demo as CascaderDemo } from '@/docs/cascader/demo'
import { Demo as HeatmapCalendarDemo } from '@/docs/heatmap-calendar/demo'
import { Demo as ParticleImageDemo } from '@/docs/particle-image/demo'
import { Demo as SparkChartDemo } from '@/docs/spark-chart/demo'
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

      <div className="3xl:max-w-screen-2xl relative z-10 mx-auto flex w-full flex-col items-center gap-8 px-4 pt-6 pb-12 md:gap-16 md:pt-14 md:pb-24">
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
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatedContent
            distance={40}
            duration={0.6}
            className="md:col-span-2"
          >
            <SpotlightCard className="flex h-full min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
              <div className="flex w-full min-w-0 flex-1 items-center justify-center overflow-hidden">
                <HeatmapCalendarDemo />
              </div>
              <Link
                href="/docs/heatmap-calendar"
                className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                Heatmap Calendar
              </Link>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent distance={40} duration={0.6} delay={0.08}>
            <SpotlightCard className="flex h-full min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
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
          </AnimatedContent>

          <AnimatedContent distance={40} duration={0.6} delay={0.16}>
            <SpotlightCard className="flex h-full min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
              <div className="flex w-full min-w-0 flex-1 items-center justify-center overflow-hidden">
                <SparkChartDemo />
              </div>
              <Link
                href="/docs/spark-chart"
                className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                Spark Chart
              </Link>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent distance={40} duration={0.6} delay={0.24}>
            <SpotlightCard className="flex h-full min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
              <div className="flex w-full flex-1 items-center justify-center">
                <CascaderDemo />
              </div>
              <Link
                href="/docs/cascader"
                className="text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                Cascader
              </Link>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent distance={40} duration={0.6} delay={0.32}>
            <SpotlightCard className="flex h-full min-h-[200px] flex-col p-4 shadow-inner md:min-h-[240px]">
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
          </AnimatedContent>

          {/* Featured block — a full composition, previewed live in an iframe. */}
          <AnimatedContent
            distance={40}
            duration={0.6}
            delay={0.4}
            className="md:col-span-2 lg:col-span-3"
          >
            <SpotlightCard className="flex h-full flex-col gap-3 p-4 shadow-inner">
              <div className="h-[600px] w-full overflow-hidden rounded-md border bg-background">
                <iframe
                  src="/blocks/view/storyboard-timeline"
                  title="Storyboard Timeline block"
                  loading="lazy"
                  className="size-full"
                />
              </div>
              <Link
                href="/blocks#storyboard-timeline"
                className="flex items-center gap-2 text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                Storyboard Timeline
                <span className="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Block
                </span>
              </Link>
            </SpotlightCard>
          </AnimatedContent>
        </div>
      </div>
    </section>
  )
}

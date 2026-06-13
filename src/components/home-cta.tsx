import Link from 'next/link'
import { AnimatedContent } from '@/components/reactbits/animated-content'
import { Button } from '@/components/ui/button'

export function HomeCta() {
  return (
    <section className="relative w-full">
      <div className="3xl:max-w-screen-2xl mx-auto w-full px-4 pb-16 md:pb-24">
        <AnimatedContent
          distance={60}
          scale={0.98}
          className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-inner md:px-12 md:py-20"
        >
          <div className="bg-foreground/[0.03] pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-5">
            <h2 className="text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl">
              Start building in minutes
            </h2>
            <p className="text-base leading-6 text-muted-foreground md:text-lg">
              Browse the components, copy what you need, and make it yours. No
              install step, no lock-in.
            </p>
            <div className="mt-2 flex flex-row gap-3">
              <Button
                nativeButton={false}
                render={<Link href="/docs/introduction" />}
              >
                Get Started
              </Button>
              <Button
                variant="secondary"
                nativeButton={false}
                render={<Link href="/docs/components" />}
              >
                Browse Components
              </Button>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  )
}

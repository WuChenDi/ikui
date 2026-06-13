import { Blocks, Bot, Copy, Palette, ShieldCheck, Sparkles } from 'lucide-react'
import { AnimatedContent } from '@/components/reactbits/animated-content'
import { SpotlightCard } from '@/components/reactbits/spotlight-card'

const features = [
  {
    icon: Copy,
    title: 'Copy & Paste',
    description:
      'Own every line. Components install straight into your codebase — no package to version-lock, no black box.',
  },
  {
    icon: Sparkles,
    title: 'Base UI Powered',
    description:
      'Built on Base UI primitives for accessible behavior — keyboard and screen-reader friendly out of the box.',
  },
  {
    icon: ShieldCheck,
    title: 'Fully Typed',
    description:
      'Written in strict TypeScript with exported prop types, so autocomplete and type-safety follow you everywhere.',
  },
  {
    icon: Palette,
    title: 'Tailwind CSS 4',
    description:
      'CSS-first theming with design tokens. Restyle anything with utility classes — light and dark handled for you.',
  },
  {
    icon: Bot,
    title: 'MCP Ready',
    description:
      'Pull components directly from your AI agent through the Model Context Protocol. Let the editor wire it up.',
  },
  {
    icon: Blocks,
    title: 'Blocks Included',
    description:
      'Go beyond primitives with ready-made business compositions — previewed live, with the full source.',
  },
]

export function Features() {
  return (
    <section className="relative w-full">
      <div className="3xl:max-w-screen-2xl mx-auto flex w-full flex-col gap-10 px-4 py-16 md:gap-14 md:py-24">
        <AnimatedContent
          distance={40}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="max-w-2xl text-base leading-6 text-muted-foreground md:text-lg">
            A focused set of polished React components — designed to be read,
            owned, and shipped.
          </p>
        </AnimatedContent>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <AnimatedContent
                key={feature.title}
                distance={40}
                duration={0.6}
                delay={index * 0.08}
              >
                <SpotlightCard className="flex h-full flex-col gap-3 p-6 shadow-inner">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-medium">{feature.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </SpotlightCard>
              </AnimatedContent>
            )
          })}
        </div>
      </div>
    </section>
  )
}

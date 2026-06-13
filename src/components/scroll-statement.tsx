import { ScrollReveal } from '@/components/reactbits/scroll-reveal'

export function ScrollStatement() {
  return (
    <section className="relative w-full">
      <div className="3xl:max-w-screen-2xl mx-auto w-full px-4 py-16 md:py-28">
        <ScrollReveal
          containerClassName="mx-auto max-w-4xl"
          textClassName="text-center text-2xl font-medium leading-snug tracking-tight md:text-4xl lg:text-5xl"
        >
          Components you can read, own, and ship — built on Base UI, styled with
          Tailwind, ready to copy into any React app.
        </ScrollReveal>
      </div>
    </section>
  )
}

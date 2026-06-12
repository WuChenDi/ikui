import Link from 'next/link'
import { BlockViewer } from '@/components/block-viewer'
import { SiteFooter } from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { getBlockCode, getBlocks } from '@/lib/blocks'
import { getDocSchema } from '@/lib/doc'
import { highlightCode } from '@/lib/highlight-code'
import { constructMetadata } from '@/lib/utils'

export const metadata = constructMetadata({
  title: 'Blocks',
  description:
    'Ready-made business compositions built from the ikui primitives. Copy, paste, install.',
})

export default async function BlocksPage() {
  const docSchema = await getDocSchema()
  const blocks = await getBlocks()
  const items = await Promise.all(
    blocks.map(async (block) => {
      const code = await getBlockCode(block.name)
      return { ...block, code, highlightedCode: await highlightCode(code) }
    }),
  )

  return (
    <div className="relative flex min-h-dvh flex-col pt-14">
      <SiteHeader docSchema={docSchema} />
      <main className="3xl:max-w-screen-2xl mx-auto flex w-full flex-1 flex-col px-4 py-12 sm:py-16">
        <header className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
            Blocks
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-6 md:text-lg">
            Ready-made business compositions built from the ikui primitives —
            previewed live, with the full source. Copy, paste, or install with
            the CLI.
          </p>

          <div className="mt-2 flex flex-row gap-3">
            <Button>
              <Link href="#blocks">Browse Blocks</Link>
            </Button>
            <Button variant="ghost">
              <Link href="/docs/components">View Components</Link>
            </Button>
          </div>
        </header>

        <div id="blocks" className="flex scroll-mt-20 flex-col gap-16">
          {items.map((block) => (
            <BlockViewer
              key={block.name}
              name={block.name}
              title={block.title}
              description={block.description}
              fileName={`components/${block.name}.tsx`}
              code={block.code}
              highlightedCode={block.highlightedCode}
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

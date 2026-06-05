import { ExternalLinkIcon } from 'lucide-react'
import { CommandCopyButton } from '@/components/command-copy-button'
import { OpenInV0Button } from '@/components/open-in-v0-button'
import { Separator } from '@/components/ui/separator'
import { getRegistryItem } from '@/lib/registry'

export async function RegistryItemHeader({ itemName }: { itemName: string }) {
  const item = await getRegistryItem(itemName)

  if (!item) {
    return null
  }

  return (
    <header className="not-prose mb-4">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {item.title}
        </h1>
        <p className="text-base text-muted-foreground">{item.description}</p>
      </div>

      {item.meta?.docs && item.meta?.docs.length > 0 && (
        <div className="flex items-center space-x-2 pt-4">
          {item.meta?.docs?.map((doc) => (
            <a
              key={doc.title}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-sm bg-secondary px-1.5 py-1 text-xs font-medium leading-none text-secondary-foreground"
            >
              {doc.title}
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          ))}
        </div>
      )}

      <div className="flex justify-end items-center mt-8 gap-2">
        <CommandCopyButton
          command={`pnpx shadcn@latest add @ikui/${item.name}`}
        />
        <Separator orientation="vertical" className="!h-4" />
        <OpenInV0Button id={item.name} />
      </div>
    </header>
  )
}

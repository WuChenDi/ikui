'use client'

import { CornerDownLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { useConfig } from '@/hooks/use-config'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useIsMac } from '@/hooks/use-is-mac'
import type { DocSchema } from '@/lib/types'

interface PageItem {
  value: string
  label: string
  url: string
  isComponent: boolean
  external: boolean
}

interface PageGroup {
  value: string
  items: PageItem[]
}

export function SearchForm({ docSchema }: { docSchema: DocSchema }) {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')
  const [selectedType, setSelectedType] = useState<'page' | 'component' | null>(
    null,
  )
  const [copyPayload, setCopyPayload] = useState('')
  const router = useRouter()
  const isMac = useIsMac()
  const { copyToClipboard } = useCopyToClipboard()
  const [config] = useConfig()
  const packageManager = config.packageManager

  const groupedItems = useMemo<PageGroup[]>(() => {
    return docSchema.map((group) => {
      const isComponentGroup = group.title !== 'Getting Started'
      return {
        value: group.title,
        items: group.items.map((item) => ({
          value: item.id,
          label: item.title,
          url: item.href ?? `/docs/${item.id}`,
          isComponent: isComponentGroup,
          external: Boolean(item.href),
        })),
      }
    })
  }, [docSchema])

  const allItems = useMemo(
    () => groupedItems.flatMap((g) => g.items),
    [groupedItems],
  )

  const handlePageHighlight = useCallback(
    (item: PageItem | null) => {
      if (!item) {
        setSelectedType(null)
        setCopyPayload('')
        return
      }

      if (item.isComponent) {
        const componentName = item.url.split('/').pop()
        setSelectedType('component')
        const componentArg = `@ikui/${componentName}`
        let cmd: string
        switch (packageManager) {
          case 'pnpm':
            cmd = `pnpm dlx shadcn@latest add ${componentArg}`
            break
          case 'bun':
            cmd = `bunx --bun shadcn@latest add ${componentArg}`
            break
          case 'yarn':
            cmd = `yarn dlx shadcn@latest add ${componentArg}`
            break
          default:
            cmd = `npx shadcn@latest add ${componentArg}`
        }
        setCopyPayload(cmd)
      } else {
        setSelectedType('page')
        setCopyPayload('')
      }
    },
    [packageManager],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }

      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        if (selectedType === 'component' && copyPayload) {
          void copyToClipboard(copyPayload)
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [copyPayload, selectedType, copyToClipboard])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="hidden sm:inline-flex cursor-text items-center gap-2 text-sm text-muted-foreground dark:bg-background dark:hover:bg-input/20 shadow-none"
      >
        <Search />
        <span className="pr-6 lg:hidden">Search...</span>
        <span className="pr-8 hidden lg:inline">Search documentation...</span>
        <Kbd>/</Kbd>
      </Button>
      <CommandDialog className="sm:max-w-xl" onOpenChange={setOpen} open={open}>
        <Command
          value={selectedValue}
          onValueChange={(value) => {
            setSelectedValue(value)
            const item = allItems.find((i) => i.value === value) ?? null
            handlePageHighlight(item)
          }}
        >
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>The search results could not be found.</CommandEmpty>
            {groupedItems.map((group, index) => (
              <Fragment key={group.value}>
                <CommandGroup heading={group.value}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => {
                        if (item.external) {
                          window.open(item.url, '_blank', 'noopener,noreferrer')
                        } else {
                          router.push(item.url)
                        }
                        setOpen(false)
                      }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {index < groupedItems.length - 1 && <CommandSeparator />}
              </Fragment>
            ))}
          </CommandList>
          <div className="flex items-center justify-between border-t px-2 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="whitespace-nowrap">Go to Page</span>
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>
            </div>
            {copyPayload ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-mono">{copyPayload}</span>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center shadow-[0_0_0_1px_var(--border)] font-normal min-h-4 px-1 rounded text-[10px]">
                    {isMac ? '⌘' : 'Ctrl'}
                    <span>C</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Kbd>Esc</Kbd>
              </div>
            )}
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}

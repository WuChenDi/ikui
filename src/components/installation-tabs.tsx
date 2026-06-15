'use client'

import { Check, Copy } from 'lucide-react'
import type { ReactNode } from 'react'
import { CodeBlockCommand } from '@/components/code-block-command'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { siteConfig } from '@/lib/config'

interface InstallationTabsProps {
  item: string
  children?: ReactNode
}

const registriesConfig = `{
  "registries": {
    "@ikui": "${siteConfig.url}/r/{name}.json"
  }
}`

function RegistryConfigBlock() {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  return (
    <div className="relative overflow-hidden rounded-md border bg-muted/30">
      <div className="relative flex items-center gap-2 border-b px-4 py-2.5 bg-background/50">
        <span
          className="font-mono text-xs text-muted-foreground"
          translate="no"
        >
          components.json
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 size-7 opacity-70 hover:bg-transparent dark:hover:bg-transparent cursor-pointer"
          onClick={() => void copyToClipboard(registriesConfig)}
        >
          <span className="sr-only">Copy</span>
          {isCopied ? (
            <Check className="size-3.5 text-emerald-600" strokeWidth={2} />
          ) : (
            <Copy className="size-3.5" strokeWidth={2} />
          )}
        </Button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto bg-background dark:bg-[#0F0F0F] not-prose">
        <code className="font-mono text-sm text-[#032F62] dark:text-[#9ECBFF]">
          {registriesConfig}
        </code>
      </pre>
    </div>
  )
}

export function InstallationTabs({ item, children }: InstallationTabsProps) {
  return (
    <Tabs defaultValue="cli" className="w-full">
      <TabsList className="not-prose bg-transparent">
        <TabsTrigger value="cli">CLI</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="cli" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            One-time setup: add the{' '}
            <code className="font-mono text-foreground">@ikui</code> registry to
            your{' '}
            <code className="font-mono text-foreground">components.json</code>.
          </p>
          <RegistryConfigBlock />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Then install the component:
          </p>
          <CodeBlockCommand item={item} />
        </div>
      </TabsContent>

      <TabsContent value="manual" className="[&_pre]:my-0">
        {children}
      </TabsContent>
    </Tabs>
  )
}

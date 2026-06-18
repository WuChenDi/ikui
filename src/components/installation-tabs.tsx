'use client'

import type { ReactNode } from 'react'
import { CodeBlockCommand } from '@/components/code-block-command'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { siteConfig } from '@/lib/config'
import { CopyButton } from '@/registry/ikui/copy-button'

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
  return (
    <div className="relative overflow-hidden rounded-md border bg-muted/30">
      <div className="relative flex items-center gap-2 border-b px-4 py-2.5 bg-background/50">
        <span
          className="font-mono text-xs text-muted-foreground"
          translate="no"
        >
          components.json
        </span>
        <CopyButton
          value={registriesConfig}
          size="sm"
          className="absolute right-2 opacity-70"
        />
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

'use client'

import type * as React from 'react'
import { CodeBlockCommand } from '@/components/code-block-command'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface InstallationTabsProps {
  item: string
  children?: React.ReactNode
}

export function InstallationTabs({ item, children }: InstallationTabsProps) {
  return (
    <Tabs defaultValue="cli" className="w-full">
      <TabsList className="not-prose bg-transparent">
        <TabsTrigger value="cli">CLI</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="cli">
        <CodeBlockCommand item={item} />
      </TabsContent>

      <TabsContent value="manual" className="[&_pre]:my-0">
        {children}
      </TabsContent>
    </Tabs>
  )
}

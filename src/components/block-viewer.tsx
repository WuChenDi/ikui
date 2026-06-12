'use client'

import {
  Check,
  Copy,
  FileCode,
  Fullscreen,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
  Terminal,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

const DEVICES = [
  { value: '100%', label: 'Desktop', Icon: Monitor },
  { value: '60%', label: 'Tablet', Icon: Tablet },
  { value: '30%', label: 'Mobile', Icon: Smartphone },
] as const

interface BlockViewerProps {
  name: string
  title: string
  description: string
  /** Display path shown in the code header, e.g. `components/audio-trimmer.tsx`. */
  fileName: string
  /** Raw source — copied verbatim. */
  code: string
  /** Pre-highlighted dual-theme HTML of `code`. */
  highlightedCode: string
  /** Preview height in px. Default: `460`. */
  iframeHeight?: number
}

export function BlockViewer({
  name,
  title,
  description,
  fileName,
  code,
  highlightedCode,
  iframeHeight = 460,
}: BlockViewerProps) {
  const [view, setView] = React.useState<'preview' | 'code'>('preview')
  const [iframeKey, setIframeKey] = React.useState(0)
  const resizablePanelRef = React.useRef<PanelImperativeHandle>(null)
  const cli = useCopyToClipboard()
  const codeCopy = useCopyToClipboard()

  const src = `/blocks/view/${name}`

  return (
    <div
      id={name}
      data-view={view}
      className="group/block-view-wrapper flex min-w-0 scroll-mt-24 flex-col gap-4"
      style={{ '--height': `${iframeHeight}px` } as React.CSSProperties}
    >
      {/* Title + full description. */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground max-w-3xl text-sm">{description}</p>
      </div>

      {/* Toolbar (desktop). */}
      <div className="hidden w-full items-center gap-2 lg:flex">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as 'preview' | 'code')}
        >
          <TabsList className="bg-muted h-8 rounded-lg p-1">
            <TabsTrigger
              value="preview"
              className="h-6 rounded-sm px-2 text-xs"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="h-6 rounded-sm px-2 text-xs">
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex h-8 items-center gap-1 rounded-md border p-[3px]">
            {DEVICES.map(({ value, label, Icon }) => (
              <Button
                key={value}
                variant="ghost"
                size="icon-sm"
                className="size-6 rounded-sm"
                title={label}
                onClick={() => {
                  setView('preview')
                  resizablePanelRef.current?.resize(value)
                }}
              >
                <Icon />
                <span className="sr-only">{label}</span>
              </Button>
            ))}
            <Separator orientation="vertical" className="my-1" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6 rounded-sm"
              title="Open in new tab"
            >
              <Link href={src} target="_blank">
                <Fullscreen />
                <span className="sr-only">Open in new tab</span>
              </Link>
            </Button>
            <Separator orientation="vertical" className="my-1" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6 rounded-sm"
              title="Refresh preview"
              onClick={() => setIframeKey((k) => k + 1)}
            >
              <RotateCw />
              <span className="sr-only">Refresh preview</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="mx-1 my-2" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              void cli.copyToClipboard(`npx shadcn@latest add @ikui/${name}`)
            }
          >
            {cli.isCopied ? <Check /> : <Terminal />}
            <span>npx shadcn add @ikui/{name}</span>
          </Button>
        </div>
      </div>

      {/* Preview — dotted canvas with a resizable panel (desktop). */}
      <div className="group-data-[view=code]/block-view-wrapper:hidden hidden md:[height:var(--height)] lg:flex">
        <div className="relative grid w-full gap-4">
          <div className="absolute inset-0 right-4 [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px] dark:[background-image:radial-gradient(#363636_1px,transparent_1px)]" />
          <ResizablePanelGroup
            orientation="horizontal"
            className="relative z-10 after:absolute after:inset-0 after:right-3 after:z-0 after:rounded-xl after:bg-muted/50"
          >
            <ResizablePanel
              panelRef={resizablePanelRef}
              className="bg-background relative overflow-hidden rounded-xl border"
              defaultSize="100%"
              minSize="30%"
            >
              <iframe
                key={iframeKey}
                src={src}
                title={title}
                loading="lazy"
                height={iframeHeight}
                className="bg-background no-scrollbar relative z-20 h-full w-full"
              />
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="relative w-3 bg-transparent p-0"
            />
            <ResizablePanel defaultSize="0%" minSize="0%" />
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Code — a code card with a filename header (desktop). */}
      <figure className="group-data-[view=preview]/block-view-wrapper:hidden m-0 hidden min-w-0 flex-col overflow-hidden rounded-xl border md:[height:var(--height)] lg:flex">
        <figcaption className="bg-muted/40 flex h-11 shrink-0 items-center gap-2 border-b px-4 text-sm">
          <FileCode className="size-4 opacity-70" />
          <span className="font-mono text-xs">{fileName}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            title="Copy code"
            onClick={() => void codeCopy.copyToClipboard(code)}
          >
            {codeCopy.isCopied ? (
              <Check className="text-emerald-500" />
            ) : (
              <Copy />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </figcaption>
        <div
          className="no-scrollbar overflow-auto text-sm [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:bg-transparent [&_pre]:p-4"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, build-time Shiki output
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </figure>

      {/* Mobile fallback — a plain iframe (no resize / code toggle). */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="bg-background overflow-hidden rounded-xl border">
          <iframe
            key={`mobile-${iframeKey}`}
            src={src}
            title={title}
            loading="lazy"
            height={iframeHeight}
            style={{ height: iframeHeight }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

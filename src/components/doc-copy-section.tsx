'use client'

import { Bot, ChevronDown } from 'lucide-react'
import { ClaudeIcon } from '@/components/icons/claude'
import { MarkdownIcon } from '@/components/icons/markdown'
import { V0Icon } from '@/components/icons/v0'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/lib/config'
import { CopyButton } from '@/registry/ikui/copy-button'

interface DocCopySectionProps {
  content: string
  url: string
}

function getPromptUrl(baseURL: string, url: string) {
  return `${baseURL}?q=${encodeURIComponent(
    `I'm looking at this ikui ui documentation: ${siteConfig.url}${url}.
Help me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.`,
  )}`
}

export function DocCopySection({ content, url }: DocCopySectionProps) {
  let pathname = '/docs'
  try {
    pathname = new URL(url).pathname
  } catch {
    pathname = url
  }

  const menuItems = [
    {
      key: 'viewMarkdown',
      href: `${pathname}.md`,
      icon: <MarkdownIcon className="h-4 w-4" />,
      label: 'View as Markdown',
    },
    {
      key: 'v0',
      href: getPromptUrl('https://v0.dev', url),
      icon: <V0Icon />,
      label: 'Open in v0',
    },
    {
      key: 'chatgpt',
      href: getPromptUrl('https://chatgpt.com', url),
      icon: <Bot />,
      label: 'Open in ChatGPT',
    },
    {
      key: 'claude',
      href: getPromptUrl('https://claude.ai/new', url),
      icon: <ClaudeIcon />,
      label: 'Open in Claude',
    },
  ]

  const dropdownContent = (
    <>
      {menuItems.map(({ key, href, icon, label }) => (
        <DropdownMenuItem
          key={key}
          render={
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              {icon}
              {label}
            </a>
          }
        />
      ))}
    </>
  )

  return (
    <ButtonGroup className="hidden md:inline-flex">
      <CopyButton
        data-slot="button"
        value={content}
        size="sm"
        className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-7 bg-secondary px-2.5 text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
      >
        Copy this page
      </CopyButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Open options"
            >
              <ChevronDown aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          {dropdownContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

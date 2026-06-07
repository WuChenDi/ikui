'use client'

import { Bot, Check, ChevronDown, Copy } from 'lucide-react'
import { useState } from 'react'
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
import { cn } from '@/lib/utils'

interface DocCopySectionProps {
  content: string
  url: string
}

function getPromptUrl(baseURL: string, url: string) {
  return `${baseURL}?q=${encodeURIComponent(
    `I'm looking at this ikui ui documentation: https://ik-ui.pages.dev${url}.
Help me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.`,
  )}`
}

export function DocCopySection({ content, url }: DocCopySectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

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
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        <div className="relative size-4">
          <div
            className={cn(
              'absolute inset-0 transition-all duration-200 flex items-center justify-center',
              copied
                ? 'scale-100 opacity-100 blur-none'
                : 'scale-70 opacity-0 blur-[2px]',
            )}
          >
            <Check className="size-4 text-emerald-500" />
          </div>
          <div
            className={cn(
              'absolute inset-0 transition-all duration-200 flex items-center justify-center',
              copied
                ? 'scale-0 opacity-0 blur-[2px]'
                : 'scale-100 opacity-100 blur-none',
            )}
          >
            <Copy className="size-4 text-muted-foreground dark:text-[#b5b5b5]" />
          </div>
        </div>
        <span>Copy this page</span>
      </Button>

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

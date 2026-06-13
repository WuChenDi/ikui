import type { DocSchema } from '@/lib/types'

export const basicDoc: DocSchema = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Introduction',
        id: 'introduction',
        description:
          'Build elegant React interfaces with premium, copy-ready Tailwind CSS components.',
      },
      {
        title: 'Components',
        id: 'components',
        description: 'Browse all available components in ikui.',
      },
      {
        title: 'Skills',
        id: 'skills',
        description:
          'An agent skill that teaches AI assistants how to find, install, and compose ikui components and blocks.',
      },
      {
        title: 'MCP',
        id: 'mcp',
        description: 'Integrating MCP with ikui lets you control it via AI.',
      },
      {
        title: 'llms.txt',
        id: 'llms',
        description: 'Plain-text index of ikui docs, optimized for LLMs.',
        href: '/llms.txt',
      },
    ],
  },
]

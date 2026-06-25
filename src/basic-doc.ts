import type { DocSchema } from '@/lib/types'

export const basicDoc: DocSchema = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Introduction',
        id: 'introduction',
        description:
          'Build elegant React interfaces with premium, copy-ready Tailwind CSS components.',
      },
      {
        title: 'Get Started',
        id: 'get-started',
        description:
          'A quick guide to adding ikui components to your application.',
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
        title: 'LLMs',
        id: 'llms',
        description:
          'Feed ikui docs to your AI coding agent: llms.txt, llms-full.txt, and per-page Markdown.',
      },
    ],
  },
]

'use client'

import { File, Folder } from 'lucide-react'
import type { TreeDataItem } from '@/registry/ikui/tree'
import { Tree } from '@/registry/ikui/tree'

const data: TreeDataItem[] = [
  {
    id: 'app',
    name: 'app',
    children: [
      { id: 'layout', name: 'layout.tsx' },
      { id: 'page', name: 'page.tsx' },
      {
        id: 'components',
        name: 'components',
        children: [
          { id: 'header', name: 'header.tsx' },
          { id: 'footer', name: 'footer.tsx' },
        ],
      },
    ],
  },
  {
    id: 'lib',
    name: 'lib',
    children: [{ id: 'utils', name: 'utils.ts' }],
  },
  { id: 'readme', name: 'README.md' },
]

export function Demo() {
  return (
    <Tree
      data={data}
      defaultNodeIcon={Folder}
      defaultLeafIcon={File}
      initialSelectedItemId="page"
      className="w-64 rounded-lg border"
    />
  )
}

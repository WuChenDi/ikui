'use client'

import { File, FileCode, FileText, Folder, FolderOpen } from 'lucide-react'
import type { TreeDataItem } from '@/registry/ikui/tree'
import { Tree } from '@/registry/ikui/tree'

const data: TreeDataItem[] = [
  {
    id: 'src',
    name: 'src',
    icon: Folder,
    openIcon: FolderOpen,
    children: [
      { id: 'index', name: 'index.ts', icon: FileCode },
      { id: 'types', name: 'types.ts', icon: FileCode },
      {
        id: 'docs',
        name: 'docs',
        icon: Folder,
        openIcon: FolderOpen,
        children: [{ id: 'guide', name: 'guide.md', icon: FileText }],
      },
    ],
  },
  { id: 'license', name: 'LICENSE', icon: File },
]

export function Demo() {
  return <Tree data={data} expandAll className="w-64 rounded-lg border" />
}

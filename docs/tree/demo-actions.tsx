'use client'

import { File, Folder, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TreeDataItem } from '@/registry/ikui/tree'
import { Tree } from '@/registry/ikui/tree'

const data: TreeDataItem[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    actions: (
      <Button size="icon-sm" variant="ghost" aria-label="Add to Inbox">
        <Plus className="size-4" />
      </Button>
    ),
    children: [
      {
        id: 'starred',
        name: 'Starred',
        actions: (
          <Button size="icon-sm" variant="ghost" aria-label="Delete Starred">
            <Trash2 className="size-4" />
          </Button>
        ),
      },
      { id: 'sent', name: 'Sent' },
    ],
  },
  { id: 'archive', name: 'Archive' },
]

export function Demo() {
  return (
    <Tree
      data={data}
      defaultNodeIcon={Folder}
      defaultLeafIcon={File}
      expandAll
      className="w-64 rounded-lg border"
    />
  )
}

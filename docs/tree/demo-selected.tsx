'use client'

import { File, Folder } from 'lucide-react'
import { useState } from 'react'
import type { TreeDataItem } from '@/registry/ikui/tree'
import { Tree } from '@/registry/ikui/tree'

const data: TreeDataItem[] = [
  {
    id: 'design',
    name: 'Design',
    children: [
      { id: 'colors', name: 'Colors' },
      { id: 'typography', name: 'Typography' },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    children: [
      { id: 'frontend', name: 'Frontend' },
      { id: 'backend', name: 'Backend' },
    ],
  },
]

export function Demo() {
  const [selected, setSelected] = useState<TreeDataItem | undefined>()

  return (
    <div className="space-y-3">
      <Tree
        data={data}
        defaultNodeIcon={Folder}
        defaultLeafIcon={File}
        onSelectChange={setSelected}
        className="w-64 rounded-lg border"
      />
      <p className="text-sm text-muted-foreground">
        Selected: {selected ? selected.name : 'none'}
      </p>
    </div>
  )
}

'use client'

import { File, Folder } from 'lucide-react'
import * as React from 'react'
import type { TreeDataItem } from '@/registry/ikui/tree'
import { Tree } from '@/registry/ikui/tree'

const initialData: TreeDataItem[] = [
  {
    id: 'app',
    name: 'app',
    droppable: true,
    children: [
      { id: 'layout', name: 'layout.tsx', draggable: true },
      { id: 'page', name: 'page.tsx', draggable: true },
    ],
  },
  {
    id: 'lib',
    name: 'lib',
    droppable: true,
    children: [{ id: 'utils', name: 'utils.ts', draggable: true }],
  },
  { id: 'readme', name: 'README.md', draggable: true },
]

/** Remove a node by id, returning the new forest and the removed node. */
function removeNode(
  nodes: TreeDataItem[],
  id: string,
): [TreeDataItem[], TreeDataItem | null] {
  let removed: TreeDataItem | null = null
  const next: TreeDataItem[] = []
  for (const node of nodes) {
    if (node.id === id) {
      removed = node
      continue
    }
    if (node.children) {
      const [children, found] = removeNode(node.children, id)
      if (found) removed = found
      next.push({ ...node, children })
    } else {
      next.push(node)
    }
  }
  return [next, removed]
}

/** Append `child` into the folder with `targetId`. */
function insertInto(
  nodes: TreeDataItem[],
  targetId: string,
  child: TreeDataItem,
): TreeDataItem[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, children: [...(node.children ?? []), child] }
    }
    if (node.children) {
      return { ...node, children: insertInto(node.children, targetId, child) }
    }
    return node
  })
}

export function Demo() {
  const [data, setData] = React.useState(initialData)

  function onDocumentDrag(source: TreeDataItem, target: TreeDataItem) {
    // Only drop into folders (nodes that have a children array).
    if (!target.children) return
    setData((prev) => {
      const [without, removed] = removeNode(prev, source.id)
      if (!removed) return prev
      return insertInto(without, target.id, removed)
    })
  }

  return (
    <Tree
      data={data}
      defaultNodeIcon={Folder}
      defaultLeafIcon={File}
      expandAll
      onDocumentDrag={onDocumentDrag}
      className="w-64 rounded-lg border"
    />
  )
}

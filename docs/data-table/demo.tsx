'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableColumnHeader } from '@/registry/ikui/data-table-column-header'
import { DataTableToolbar } from '@/registry/ikui/data-table-toolbar'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
}

const data: Task[] = [
  {
    id: 'TASK-1',
    title: 'Wire up the auth flow',
    status: 'in-progress',
    priority: 'high',
    estimatedHours: 8,
  },
  {
    id: 'TASK-2',
    title: 'Design the settings page',
    status: 'todo',
    priority: 'medium',
    estimatedHours: 5,
  },
  {
    id: 'TASK-3',
    title: 'Fix the pagination bug',
    status: 'done',
    priority: 'high',
    estimatedHours: 2,
  },
  {
    id: 'TASK-4',
    title: 'Write the API docs',
    status: 'todo',
    priority: 'low',
    estimatedHours: 4,
  },
  {
    id: 'TASK-5',
    title: 'Add dark mode tokens',
    status: 'in-progress',
    priority: 'medium',
    estimatedHours: 6,
  },
  {
    id: 'TASK-6',
    title: 'Optimize the image loader',
    status: 'todo',
    priority: 'high',
    estimatedHours: 3,
  },
  {
    id: 'TASK-7',
    title: 'Refactor the table state',
    status: 'done',
    priority: 'low',
    estimatedHours: 7,
  },
  {
    id: 'TASK-8',
    title: 'Set up CI caching',
    status: 'in-progress',
    priority: 'medium',
    estimatedHours: 5,
  },
]

const statusVariants: Record<Task['status'], string> = {
  todo: 'secondary',
  'in-progress': 'default',
  done: 'outline',
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('title')}</span>
    ),
    meta: { label: 'Title', variant: 'text', placeholder: 'Filter titles...' },
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as Task['status']
      return (
        <Badge variant={statusVariants[status] as 'default'}>{status}</Badge>
      )
    },
    meta: {
      label: 'Status',
      variant: 'select',
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
      ],
    },
    enableColumnFilter: true,
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue('priority')}</span>
    ),
    meta: {
      label: 'Priority',
      variant: 'multiSelect',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    enableColumnFilter: true,
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'estimatedHours',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Est. hours" />
    ),
    cell: ({ row }) => `${row.getValue('estimatedHours')}h`,
    meta: { label: 'Est. hours', variant: 'range', range: [0, 12], unit: 'h' },
    enableColumnFilter: true,
    filterFn: (row, id, value: [number, number]) => {
      const v = row.getValue<number>(id)
      return v >= value[0] && v <= value[1]
    },
  },
]

export function Demo() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 5 } },
  })

  return (
    <div className="w-full">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  )
}

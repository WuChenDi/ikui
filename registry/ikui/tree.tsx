'use client'

import { ChevronRight } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TreeDataItem {
  id: string
  name: string
  icon?: React.ComponentType<{ className?: string }>
  selectedIcon?: React.ComponentType<{ className?: string }>
  openIcon?: React.ComponentType<{ className?: string }>
  children?: TreeDataItem[]
  actions?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export interface TreeRenderItemParams {
  item: TreeDataItem
  level: number
  isLeaf: boolean
  isSelected: boolean
  isOpen?: boolean
  hasChildren: boolean
}

export interface TreeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  data: TreeDataItem[] | TreeDataItem
  initialSelectedItemId?: string
  onSelectChange?: (item: TreeDataItem) => void
  expandAll?: boolean
  chevronPosition?: 'left' | 'right'
  defaultNodeIcon?: React.ComponentType<{ className?: string }>
  defaultLeafIcon?: React.ComponentType<{ className?: string }>
  renderItem?: (params: TreeRenderItemParams) => React.ReactNode
}

function collectExpandedIds(
  data: TreeDataItem[],
  selectedId: string | undefined,
  expandAll: boolean,
): Set<string> {
  const ids = new Set<string>()

  function walk(items: TreeDataItem[]): boolean {
    let found = false
    for (const item of items) {
      const hasChildren = !!item.children?.length
      const isTarget = item.id === selectedId
      const childMatch = hasChildren && walk(item.children!)
      if (expandAll && hasChildren) {
        ids.add(item.id)
      } else if (hasChildren && (childMatch || isTarget)) {
        ids.add(item.id)
      }
      if (isTarget || childMatch) found = true
    }
    return found
  }

  walk(data)
  return ids
}

function getIcon(
  item: TreeDataItem,
  isOpen: boolean,
  isSelected: boolean,
  fallback?: React.ComponentType<{ className?: string }>,
) {
  if (isSelected && item.selectedIcon) return item.selectedIcon
  if (isOpen && item.openIcon) return item.openIcon
  return item.icon ?? fallback
}

interface TreeNodeProps {
  item: TreeDataItem
  level: number
  selectedItemId?: string
  onSelect: (item: TreeDataItem) => void
  expandedIds: Set<string>
  defaultNodeIcon?: React.ComponentType<{ className?: string }>
  defaultLeafIcon?: React.ComponentType<{ className?: string }>
  renderItem?: (params: TreeRenderItemParams) => React.ReactNode
  chevronPosition: 'left' | 'right'
}

function TreeNode({
  item,
  level,
  selectedItemId,
  onSelect,
  expandedIds,
  defaultNodeIcon,
  defaultLeafIcon,
  renderItem,
  chevronPosition,
}: TreeNodeProps) {
  const hasChildren = !!item.children?.length
  const [open, setOpen] = React.useState(() => expandedIds.has(item.id))
  const isSelected = selectedItemId === item.id
  const Icon = getIcon(
    item,
    open,
    isSelected,
    hasChildren ? defaultNodeIcon : defaultLeafIcon,
  )

  function handleClick() {
    if (item.disabled) return
    if (hasChildren) setOpen((v) => !v)
    onSelect(item)
    item.onClick?.()
  }

  const chevron = hasChildren ? (
    <ChevronRight
      className={cn(
        'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
        open && 'rotate-90',
        chevronPosition === 'left' ? 'mr-1' : 'ml-1',
      )}
    />
  ) : (
    chevronPosition === 'left' && <span className="mr-1 size-4 shrink-0" />
  )

  return (
    <li
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? open : undefined}
    >
      <div
        role="button"
        tabIndex={item.disabled ? -1 : 0}
        aria-disabled={item.disabled || undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        className={cn(
          'group relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-left text-sm outline-hidden transition-colors',
          'hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring/50',
          isSelected && 'bg-accent/70 text-accent-foreground',
          item.disabled && 'pointer-events-none opacity-50',
          item.className,
        )}
      >
        {chevronPosition === 'left' && chevron}
        {renderItem ? (
          renderItem({
            item,
            level,
            isLeaf: !hasChildren,
            isSelected,
            isOpen: open,
            hasChildren,
          })
        ) : (
          <>
            {Icon && <Icon className="mr-2 size-4 shrink-0" />}
            <span className="grow truncate">{item.name}</span>
            {item.actions && (
              <span
                className={cn(
                  'ml-auto shrink-0 group-hover:opacity-100',
                  isSelected ? 'opacity-100' : 'opacity-0',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {item.actions}
              </span>
            )}
          </>
        )}
        {chevronPosition === 'right' && chevron}
      </div>

      {hasChildren && (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <ul className="ml-4 border-l border-border pl-1" role="group">
              {item.children!.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  level={level + 1}
                  selectedItemId={selectedItemId}
                  onSelect={onSelect}
                  expandedIds={expandedIds}
                  defaultNodeIcon={defaultNodeIcon}
                  defaultLeafIcon={defaultLeafIcon}
                  renderItem={renderItem}
                  chevronPosition={chevronPosition}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}

export function Tree({
  data,
  initialSelectedItemId,
  onSelectChange,
  expandAll = false,
  chevronPosition = 'left',
  defaultNodeIcon,
  defaultLeafIcon,
  renderItem,
  className,
  ...props
}: TreeProps) {
  const items = React.useMemo(
    () => (Array.isArray(data) ? data : [data]),
    [data],
  )
  const [selectedItemId, setSelectedItemId] = React.useState(
    initialSelectedItemId,
  )
  const expandedIds = React.useMemo(
    () => collectExpandedIds(items, initialSelectedItemId, expandAll),
    [items, initialSelectedItemId, expandAll],
  )

  const handleSelect = React.useCallback(
    (item: TreeDataItem) => {
      setSelectedItemId(item.id)
      onSelectChange?.(item)
    },
    [onSelectChange],
  )

  return (
    <div className={cn('relative p-2', className)} {...props}>
      <ul role="tree">
        {items.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            level={0}
            selectedItemId={selectedItemId}
            onSelect={handleSelect}
            expandedIds={expandedIds}
            defaultNodeIcon={defaultNodeIcon}
            defaultLeafIcon={defaultLeafIcon}
            renderItem={renderItem}
            chevronPosition={chevronPosition}
          />
        ))}
      </ul>
    </div>
  )
}

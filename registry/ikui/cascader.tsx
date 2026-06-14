'use client'

import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export interface CascaderOption {
  value: string
  label: React.ReactNode
  textLabel?: string
  disabled?: boolean
  children?: CascaderOption[]
}

export interface CascaderProps {
  options: CascaderOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[], selectedOptions: CascaderOption[]) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  className?: string
  popupClassName?: string
  expandTrigger?: 'click' | 'hover'
  displayRender?: (
    labels: string[],
    selectedOptions: CascaderOption[],
  ) => React.ReactNode
}

function getStringLabel(option: CascaderOption): string {
  if (option.textLabel) return option.textLabel
  if (typeof option.label === 'string') return option.label
  return option.value
}

export function Cascader({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Please select',
  disabled = false,
  allowClear = true,
  className,
  popupClassName,
  expandTrigger = 'click',
  displayRender,
}: CascaderProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue || [],
  )
  const [expandedPath, setExpandedPath] = React.useState<string[]>([])
  const [focusedColumn, setFocusedColumn] = React.useState(0)
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const isMobile = useIsMobile()
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const columnRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())

  const selectedValue = value !== undefined ? value : internalValue

  const getColumns = React.useCallback(() => {
    const columns: CascaderOption[][] = [options]
    let currentOptions = options

    for (const val of expandedPath) {
      const found = currentOptions.find((opt) => opt.value === val)
      if (found?.children) {
        columns.push(found.children)
        currentOptions = found.children
      } else {
        break
      }
    }

    return columns
  }, [options, expandedPath])

  const getSelectedOptions = React.useCallback(
    (vals: string[]): CascaderOption[] => {
      const result: CascaderOption[] = []
      let currentOptions = options

      for (const val of vals) {
        const found = currentOptions.find((opt) => opt.value === val)
        if (found) {
          result.push(found)
          currentOptions = found.children || []
        } else {
          break
        }
      }

      return result
    },
    [options],
  )

  const selectedOptions = getSelectedOptions(selectedValue)
  const displayLabels = selectedOptions.map((opt) => getStringLabel(opt))

  const handleSelect = (option: CascaderOption, columnIndex: number) => {
    if (option.disabled) return

    const newPath = [...expandedPath.slice(0, columnIndex), option.value]

    if (option.children && option.children.length > 0) {
      setExpandedPath(newPath)
      setFocusedColumn(columnIndex + 1)
      setFocusedIndex(0)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            left: scrollContainerRef.current.scrollWidth,
            behavior: 'smooth',
          })
        }
        const key = `${columnIndex + 1}-0`
        columnRefs.current.get(key)?.focus()
      }, 50)
    } else {
      const newSelectedOptions = getSelectedOptions(newPath)
      if (value === undefined) {
        setInternalValue(newPath)
      }
      onChange?.(newPath, newSelectedOptions)
      setOpen(false)
      setExpandedPath([])
    }
  }

  const handleExpand = (option: CascaderOption, columnIndex: number) => {
    if (option.disabled) return
    const newPath = [...expandedPath.slice(0, columnIndex), option.value]
    setExpandedPath(newPath)
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth,
          behavior: 'smooth',
        })
      }
    }, 50)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (value === undefined) {
      setInternalValue([])
    }
    onChange?.([], [])
    setExpandedPath([])
    setOpen(false)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    option: CascaderOption,
    columnIndex: number,
    itemIndex: number,
    columns: CascaderOption[][],
  ) => {
    const column = columns[columnIndex]
    const hasChildren = option.children && option.children.length > 0

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (itemIndex < column.length - 1) {
          const nextIndex = itemIndex + 1
          setFocusedIndex(nextIndex)
          const key = `${columnIndex}-${nextIndex}`
          columnRefs.current.get(key)?.focus()
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (itemIndex > 0) {
          const prevIndex = itemIndex - 1
          setFocusedIndex(prevIndex)
          const key = `${columnIndex}-${prevIndex}`
          columnRefs.current.get(key)?.focus()
        }
        break

      case 'ArrowRight':
      case 'Enter':
        e.preventDefault()
        if (!option.disabled) {
          if (hasChildren) {
            handleSelect(option, columnIndex)
          } else if (e.key === 'Enter') {
            handleSelect(option, columnIndex)
          }
        }
        break

      case 'ArrowLeft':
      case 'Backspace':
        e.preventDefault()
        if (columnIndex > 0) {
          const newPath = expandedPath.slice(0, columnIndex - 1)
          setExpandedPath(newPath)
          setFocusedColumn(columnIndex - 1)
          const parentColumn = columns[columnIndex - 1]
          const parentValue = expandedPath[columnIndex - 1]
          const parentIndex = parentColumn.findIndex(
            (opt) => opt.value === parentValue,
          )
          setFocusedIndex(parentIndex >= 0 ? parentIndex : 0)
          setTimeout(() => {
            const key = `${columnIndex - 1}-${parentIndex >= 0 ? parentIndex : 0}`
            columnRefs.current.get(key)?.focus()
          }, 50)
        }
        break

      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setExpandedPath([])
        break

      case 'Tab':
        if (
          !e.shiftKey &&
          hasChildren &&
          expandedPath[columnIndex] === option.value
        ) {
          e.preventDefault()
          setFocusedColumn(columnIndex + 1)
          setFocusedIndex(0)
          const key = `${columnIndex + 1}-0`
          columnRefs.current.get(key)?.focus()
        } else if (e.shiftKey && columnIndex > 0) {
          e.preventDefault()
          const parentColumn = columns[columnIndex - 1]
          const parentValue = expandedPath[columnIndex - 1]
          const parentIndex = parentColumn.findIndex(
            (opt) => opt.value === parentValue,
          )
          setFocusedColumn(columnIndex - 1)
          setFocusedIndex(parentIndex >= 0 ? parentIndex : 0)
          const key = `${columnIndex - 1}-${parentIndex >= 0 ? parentIndex : 0}`
          columnRefs.current.get(key)?.focus()
        }
        break
    }
  }

  const displayValue =
    displayLabels.length > 0
      ? displayRender
        ? displayRender(displayLabels, selectedOptions)
        : displayLabels.join(' / ')
      : null

  const triggerElement = (
    <div
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'inline-flex h-9 w-[200px] cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        !displayValue && 'text-muted-foreground',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!disabled) setOpen(!open)
        }
      }}
    >
      <span className="flex-1 truncate text-left font-normal">
        {displayValue || placeholder}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {allowClear && displayValue && !disabled && (
          <button
            type="button"
            className="flex items-center justify-center rounded-sm opacity-50 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleClear}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
      </div>
    </div>
  )

  const columns = getColumns()

  const columnsContent = (
    <div
      ref={scrollContainerRef}
      className={cn('flex', isMobile && 'overflow-x-auto')}
      role="listbox"
      aria-label={placeholder}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex === 0 ? 'root' : expandedPath[columnIndex - 1]}
          role="group"
          aria-label={`Level ${columnIndex + 1}`}
          className={cn(
            'max-h-[300px] min-w-[130px] shrink-0 overflow-auto p-1',
            columnIndex !== columns.length - 1 && 'border-r border-border',
          )}
        >
          {column.map((option, itemIndex) => {
            const isExpanded = expandedPath[columnIndex] === option.value
            const isSelected = selectedValue[columnIndex] === option.value
            const hasChildren = option.children && option.children.length > 0
            const isFocused =
              focusedColumn === columnIndex && focusedIndex === itemIndex
            const refKey = `${columnIndex}-${itemIndex}`

            return (
              <div
                key={option.value}
                ref={(el) => {
                  if (el) {
                    columnRefs.current.set(refKey, el)
                  } else {
                    columnRefs.current.delete(refKey)
                  }
                }}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                aria-expanded={hasChildren ? isExpanded : undefined}
                tabIndex={isFocused && open ? 0 : -1}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground',
                  (isSelected || isExpanded) &&
                    'bg-accent text-accent-foreground',
                  option.disabled && 'pointer-events-none opacity-50',
                )}
                onClick={() => handleSelect(option, columnIndex)}
                onKeyDown={(e) =>
                  handleKeyDown(e, option, columnIndex, itemIndex, columns)
                }
                onMouseEnter={() => {
                  if (expandTrigger === 'hover' && hasChildren) {
                    handleExpand(option, columnIndex)
                  }
                }}
                onFocus={() => {
                  setFocusedColumn(columnIndex)
                  setFocusedIndex(itemIndex)
                }}
              >
                <span className="truncate">{option.label}</span>
                {hasChildren && (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 opacity-50"
                    aria-hidden="true"
                  />
                )}
                {!hasChildren && isSelected && (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setExpandedPath(
        selectedValue.slice(0, -1).length > 0
          ? selectedValue.slice(0, -1)
          : selectedValue,
      )
      setFocusedColumn(0)
      setFocusedIndex(0)
      setTimeout(() => {
        const key = `0-0`
        columnRefs.current.get(key)?.focus()
      }, 50)
    } else {
      setExpandedPath([])
    }
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{triggerElement}</DrawerTrigger>
        <DrawerContent className={cn('px-0', popupClassName)}>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-sm font-medium">
              {placeholder}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{columnsContent}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={triggerElement} nativeButton={false} />
      <PopoverContent
        className={cn('w-auto p-0', popupClassName)}
        align="start"
      >
        {columnsContent}
      </PopoverContent>
    </Popover>
  )
}

import type { Column, RowData } from '@tanstack/react-table'

/**
 * The filter variants a column can declare through `columnDef.meta.variant`.
 * The toolbar renders a matching control for each one.
 */
export type FilterVariant =
  | 'text'
  | 'number'
  | 'range'
  | 'date'
  | 'dateRange'
  | 'select'
  | 'multiSelect'

/** An option for the faceted (select / multiSelect) filter. */
export interface Option {
  label: string
  value: string
  count?: number
  icon?: React.FC<React.SVGProps<SVGSVGElement>>
}

// Teach TanStack Table about the extra per-column metadata the toolbar and
// filters read. Importing this file anywhere in the program applies the
// augmentation, so the `column.columnDef.meta` fields below are typed.
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    placeholder?: string
    variant?: FilterVariant
    options?: Option[]
    range?: [number, number]
    unit?: string
    icon?: React.FC<React.SVGProps<SVGSVGElement>>
  }
}

/**
 * Sticky-column styles for a pinned TanStack Table column. Returns the inline
 * styles that keep a left/right pinned column fixed while the rest scrolls,
 * with an optional inset shadow on the last pinned column of each side.
 */
export function getCommonPinningStyles<TData>({
  column,
  withBorder = false,
  isHeader = false,
}: {
  column: Column<TData>
  /** Draw an inset shadow on the outermost pinned column of each side. */
  withBorder?: boolean
  /** Header cells keep their own background, so skip the card fill. */
  isHeader?: boolean
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? '-4px 0 4px -4px var(--border) inset'
        : isFirstRightPinnedColumn
          ? '4px 0 4px -4px var(--border) inset'
          : undefined
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: 1,
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned && !isHeader ? 'var(--card)' : '',
    width: column.getSize(),
    minWidth: column.getSize(),
    maxWidth: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

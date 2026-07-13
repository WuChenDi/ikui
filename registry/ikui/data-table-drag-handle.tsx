import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * A grab handle for a draggable row. Render it in a column with id `"drag"`;
 * the DataTable wires the drag listeners onto that cell.
 */
export function DataTableDragHandle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 cursor-grab text-muted-foreground hover:bg-transparent active:cursor-grabbing"
      data-drag-handle="true"
    >
      <GripVertical />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

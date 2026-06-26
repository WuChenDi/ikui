'use client'

import { HeatmapCalendar } from '@/registry/ikui/heatmap-calendar'
import { activity, END_DATE } from './sample-data'

export function Demo() {
  return (
    <HeatmapCalendar
      data={activity}
      endDate={END_DATE}
      renderTooltip={(cell) => (
        <span>
          <strong>{cell.value}</strong> contributions · {cell.label}
        </span>
      )}
    />
  )
}

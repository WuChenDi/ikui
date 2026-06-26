import { HeatmapCalendar } from '@/registry/ikui/heatmap-calendar'
import { activity, END_DATE } from './sample-data'

export function Demo() {
  return (
    <HeatmapCalendar
      data={activity}
      endDate={END_DATE}
      legend={{ placement: 'right' }}
    />
  )
}

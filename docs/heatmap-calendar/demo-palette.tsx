import { HeatmapCalendar } from '@/registry/ikui/heatmap-calendar'
import { activity, END_DATE } from './sample-data'

const palette = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

export function Demo() {
  return (
    <HeatmapCalendar data={activity} endDate={END_DATE} palette={palette} />
  )
}

'use client'

import { DateRangePicker } from '@/registry/ikui/date-range-picker'

export function Demo() {
  return (
    <DateRangePicker presets={[]} numberOfMonths={1} placeholder="No presets" />
  )
}

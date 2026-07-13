'use client'

import { addDays } from 'date-fns'
import type { DateRangePreset } from '@/registry/ikui/date-range-picker'
import { DateRangePicker } from '@/registry/ikui/date-range-picker'

const presets: DateRangePreset[] = [
  {
    label: 'Next 3 days',
    range: () => ({ from: new Date(), to: addDays(new Date(), 2) }),
  },
  {
    label: 'Next 2 weeks',
    range: () => ({ from: new Date(), to: addDays(new Date(), 13) }),
  },
  {
    label: 'Next 30 days',
    range: () => ({ from: new Date(), to: addDays(new Date(), 29) }),
  },
]

export function Demo() {
  return <DateRangePicker presets={presets} placeholder="Custom presets" />
}

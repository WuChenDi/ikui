'use client'

import { addDays, subDays } from 'date-fns'
import { DateRangePicker } from '@/registry/ikui/date-range-picker'

export function Demo() {
  const minDate = subDays(new Date(), 7)
  const maxDate = addDays(new Date(), 7)

  return (
    <DateRangePicker
      minDate={minDate}
      maxDate={maxDate}
      placeholder="Within ±7 days"
    />
  )
}

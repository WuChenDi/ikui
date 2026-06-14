'use client'

import { useState } from 'react'
import type { CascaderOption } from '@/registry/ikui/cascader'
import { Cascader } from '@/registry/ikui/cascader'

const options: CascaderOption[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          { value: 'xihu', label: 'West Lake' },
          { value: 'yuhang', label: 'Yuhang' },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          { value: 'xuanwu', label: 'Xuanwu' },
          { value: 'qinhuai', label: 'Qinhuai' },
        ],
      },
    ],
  },
]

export function Demo() {
  const [value, setValue] = useState<string[]>(['zhejiang', 'hangzhou', 'xihu'])

  return (
    <div className="flex flex-col items-center gap-3">
      <Cascader options={options} value={value} onChange={setValue} />
      <p className="text-sm text-muted-foreground">
        Value: {value.length ? value.join(' / ') : '(none)'}
      </p>
    </div>
  )
}

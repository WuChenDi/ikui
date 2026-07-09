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
    children: [{ value: 'nanjing', label: 'Nanjing' }],
  },
]

export function Demo() {
  return (
    <div className="flex items-center gap-3">
      <Cascader options={options} size="sm" placeholder="Small" />
      <Cascader options={options} size="default" placeholder="Default" />
    </div>
  )
}

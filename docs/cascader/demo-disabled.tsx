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
          { value: 'yuhang', label: 'Yuhang', disabled: true },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    disabled: true,
    children: [{ value: 'nanjing', label: 'Nanjing' }],
  },
]

export function Demo() {
  return <Cascader options={options} allowClear={false} />
}

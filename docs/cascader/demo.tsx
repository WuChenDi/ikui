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
      {
        value: 'ningbo',
        label: 'Ningbo',
        children: [{ value: 'haishu', label: 'Haishu' }],
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
      {
        value: 'suzhou',
        label: 'Suzhou',
        children: [{ value: 'gusu', label: 'Gusu' }],
      },
    ],
  },
]

export function Demo() {
  return <Cascader options={options} />
}

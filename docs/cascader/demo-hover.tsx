import type { CascaderOption } from '@/registry/ikui/cascader'
import { Cascader } from '@/registry/ikui/cascader'

const options: CascaderOption[] = [
  {
    value: 'frontend',
    label: 'Frontend',
    children: [
      {
        value: 'react',
        label: 'React',
        children: [
          { value: 'next', label: 'Next.js' },
          { value: 'remix', label: 'Remix' },
        ],
      },
      {
        value: 'vue',
        label: 'Vue',
        children: [{ value: 'nuxt', label: 'Nuxt' }],
      },
    ],
  },
  {
    value: 'backend',
    label: 'Backend',
    children: [
      {
        value: 'node',
        label: 'Node.js',
        children: [
          { value: 'hono', label: 'Hono' },
          { value: 'express', label: 'Express' },
        ],
      },
    ],
  },
]

export function Demo() {
  return (
    <Cascader
      options={options}
      expandTrigger="hover"
      placeholder="Pick a stack"
    />
  )
}

import { cache } from 'react'
import { basicDoc } from '@/basic-doc'
import { getRegistry } from './registry'
import type { DocItem, DocSchema, RegistryItem } from './types'

const COMPONENTS_CATEGORIES = ['components', 'other'] as const

const CATEGORY_LABELS: Record<string, string> = {
  audio: 'Audio',
  video: 'Video',
  timeline: 'Timeline',
  image: 'Image',
  button: 'Buttons',
  form: 'Form',
  display: 'Display',
}

const CATEGORY_ORDER = [
  'audio',
  'video',
  'timeline',
  'image',
  'button',
  'form',
  'display',
]

function toDocItem(item: RegistryItem): DocItem {
  return {
    id: item.name,
    title: item.title,
    description: item.description,
    meta: item.meta,
  }
}

function groupByCategory(items: RegistryItem[]) {
  const groups = new Map<string, DocItem[]>()
  for (const item of items) {
    const key = item.category ?? 'other'
    const doc = toDocItem(item)
    groups.set(key, [...(groups.get(key) ?? []), doc])
  }
  return groups
}

// `cache` dedupes these across a single request: the docs page calls
// getDocSchema / allDocItems / getDoc several times per render, and each would
// otherwise re-read the registry and rebuild the schema.
export const getDocSchema = cache(async () => {
  const { items } = await getRegistry()
  const components = items.filter((i) => i.type === 'registry:component')
  const byCategory = groupByCategory(components)

  const componentsItems = COMPONENTS_CATEGORIES.flatMap(
    (key) => byCategory.get(key) ?? [],
  )
  const orderedKeys = CATEGORY_ORDER.filter((k) => byCategory.has(k))
  const extraKeys = [...byCategory.keys()].filter(
    (k) =>
      !(COMPONENTS_CATEGORIES as readonly string[]).includes(k) &&
      !CATEGORY_ORDER.includes(k),
  )

  const componentGroups: DocSchema = [
    { title: 'Components', items: componentsItems },
    ...orderedKeys
      .concat(extraKeys)
      .map((key) => ({
        title: CATEGORY_LABELS[key] ?? key,
        items: byCategory.get(key) ?? [],
      }))
      .filter((g) => g.items.length > 0),
  ]

  return [...basicDoc, ...componentGroups]
})

export const allDocItems = cache(async () => {
  const schema = await getDocSchema()
  return schema.flatMap((section) => section.items).filter((item) => !item.href)
})

export const getDoc = cache(async (id: string) => {
  const allItems = await allDocItems()
  return allItems.find((item) => item.id === id)
})

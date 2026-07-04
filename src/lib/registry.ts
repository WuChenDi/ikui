import type { Registry } from './types'

export const getRegistry = async (): Promise<Registry> => {
  const registryData = await import('@/registry.json')
  const registry = registryData.default as Registry
  // Minimal runtime guard for the `as Registry` cast: everything downstream
  // iterates `items`, so fail loudly if the manifest is not the expected shape.
  if (!registry || !Array.isArray(registry.items)) {
    throw new Error('registry.json is malformed: expected an `items` array')
  }
  return registry
}

export const getRegistryItem = async (name: string) => {
  const registry = await getRegistry()
  return registry.items.find((item) => item.name === name)
}

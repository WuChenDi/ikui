export interface DocItem {
  id: string
  title: string
  description: string
  /** When set, the nav entry links to this raw/external URL instead of a `/docs/:id` page. */
  href?: string
  meta?: {
    docs?: Array<{
      title: string
      url: string
    }>
  }
}

export type DocSchema = Array<{
  title: string
  items: DocItem[]
}>

export interface RegistryItem {
  name: string
  type:
    | 'registry:component'
    | 'registry:hook'
    | 'registry:lib'
    | 'registry:block'
  title: string
  description: string
  category?: string
  files: Array<{
    path: string
    type: string
  }>
  dependencies?: string[]
  registryDependencies?: string[]
  meta?: {
    docs?: Array<{
      title: string
      url: string
    }>
    /** Preview iframe height in px for `registry:block` items. */
    iframeHeight?: number
  }
}

export interface Registry {
  $schema?: string
  name?: string
  homepage?: string
  author?: string
  items: RegistryItem[]
}

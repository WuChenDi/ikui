import { readFile } from 'fs/promises'
import { join } from 'path'
import { getRegistry } from './registry'
import type { RegistryItem } from './types'

/** Block sources live here, one `<name>.tsx` per block. */
const BLOCKS_DIR = 'registry/ikui/blocks'

export interface Block {
  name: string
  title: string
  description: string
}

function toBlock(item: RegistryItem): Block {
  return { name: item.name, title: item.title, description: item.description }
}

/** All `registry:block` items — the business compositions shown under `/blocks`. */
export async function getBlocks(): Promise<Block[]> {
  const { items } = await getRegistry()
  return items.filter((i) => i.type === 'registry:block').map(toBlock)
}

export async function getBlock(name: string): Promise<Block | undefined> {
  const blocks = await getBlocks()
  return blocks.find((b) => b.name === name)
}

/**
 * The block's source — the exact text a user copies / installs. Scoped to a
 * literal subfolder so the bundler does not trace the whole project.
 */
export async function getBlockCode(name: string): Promise<string> {
  return readFile(join(process.cwd(), BLOCKS_DIR, `${name}.tsx`), 'utf-8')
}

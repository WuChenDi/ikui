import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { basicDoc } from '../basic-doc'

/** Marketing blurb shared by the `llms.txt` and `llms-full.txt` headers. */
const SITE_DESCRIPTION =
  'ikui is a curated collection of reusable React components, blocks, and ' +
  'templates for building captivating landing pages and user-focused marketing ' +
  'materials. Built with React, Tailwind CSS, and Motion, it draws heavy ' +
  'inspiration from shadcn/ui with a magical twist. Components are copy-ready ' +
  'and installable via the shadcn CLI.'

/** Fallback site base URL when `registry.json` has no `homepage`. */
const SITE_URL = 'https://ik-ui.pages.dev'

/** Repository link surfaced in the `llms.txt` "Optional" section. */
const GITHUB_URL = 'https://github.com/WuChenDi/ikui'

interface Registry {
  homepage?: string
  items: { name: string; title: string; type: string; description?: string }[]
}

/**
 * Turn an authored doc.mdx string into clean Markdown for LLMs / "Copy this page".
 *
 * The authored MDX relies on wrapper components (`<DemoCanvas>`, `<InstallationTabs>`,
 * `<PropsTable>`) and empty ```code fences``` whose body is injected from disk by
 * `remark-code-import` at render time. Neither the raw file nor the rendered DOM is a
 * good copy source, so we resolve the `file=` imports and flatten the wrappers here.
 *
 * Reads referenced demo files with `fs`, so both callers (the docs page and the
 * `.md` route) must run at build time — they are statically generated, not Edge.
 *
 * @param content Raw doc.mdx text.
 * @param docDir  Absolute path to the doc's directory (`docs/<id>`).
 */
export async function processMdxForLLMs(
  content: string,
  docDir: string,
): Promise<string> {
  content = stripLeadingImports(content)
  // Drop the install block (and its full registry source) before inlining, so the
  // only file= fences left to inline are the small demo examples.
  content = flattenInstallationTabs(content)
  content = await inlineFileImports(content, docDir)
  content = flattenDemoCanvas(content)
  content = propsTableToMarkdown(content)
  content = content.replaceAll('@/registry/ikui/', '@/components/ikui/')
  return content.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/**
 * Drop the leading MDX `import … from './demo'` block. These reference the demo
 * components we inline below, so they are noise once the page is flattened.
 */
function stripLeadingImports(content: string): string {
  return content.replace(/^(?:[ \t]*import[^\n]*\n|[ \t]*\n)+/, '')
}

/**
 * Replace ` ```lang file=./x.tsx ``` ` fences with the actual file contents.
 */
async function inlineFileImports(
  content: string,
  docDir: string,
): Promise<string> {
  const fenceRe =
    /[ \t]*```(\w+)[ \t]+file=([^\s`]+)[^\n]*\n([\s\S]*?)[ \t]*```/g
  return replaceAsync(fenceRe, content, async (_match, lang, rel) => {
    try {
      const code = await readFile(resolve(docDir, rel), 'utf-8')
      return `\`\`\`${lang}\n${code.trimEnd()}\n\`\`\``
    } catch {
      return `\`\`\`${lang}\n\`\`\``
    }
  })
}

/**
 * `<DemoCanvas><DemoPreview>…</DemoPreview><DemoCode>```…```</DemoCode></DemoCanvas>`
 * → just the code block. The preview is a React reference with no value to an LLM.
 */
function flattenDemoCanvas(content: string): string {
  return content.replace(
    /<DemoCanvas[^>]*>([\s\S]*?)<\/DemoCanvas>/g,
    (_match, inner) => {
      const code = inner.match(/<DemoCode>([\s\S]*?)<\/DemoCode>/)
      return code ? `${code[1].trim()}\n` : ''
    },
  )
}

/**
 * `<InstallationTabs item="x">```…```</InstallationTabs>` → just the CLI command.
 *
 * The block's body is the full registry component source; like shadcn we never
 * inline that into the Markdown, only point at the install command.
 */
function flattenInstallationTabs(content: string): string {
  return content.replace(
    /<InstallationTabs\s+item="([^"]+)"[^>]*>[\s\S]*?<\/InstallationTabs>/g,
    (_match, item) =>
      `\`\`\`bash\nnpx shadcn@latest add @ikui/${item}\n\`\`\`\n`,
  )
}

/**
 * `<PropsTable data={[{ name, type, default, nameDetails, typeDetails }, …]} />`
 * → a Markdown table. Left untouched if the data array cannot be parsed.
 */
function propsTableToMarkdown(content: string): string {
  return content.replace(
    /<PropsTable\s+data=\{(\[[\s\S]*?\])\}\s*\/>/g,
    (full, dataText) => {
      const objects = dataText.match(/\{[^{}]*\}/g)
      if (!objects) {
        return full
      }
      const get = (obj: string, key: string) =>
        obj.match(new RegExp(`${key}\\s*:\\s*"([^"]*)"`))?.[1] ?? ''
      const rows = objects.map((obj: string) => {
        const name = get(obj, 'name')
        const type = get(obj, 'type')
        const def = get(obj, 'default')
        const desc = get(obj, 'nameDetails') || get(obj, 'typeDetails')
        return `| \`${name}\` | \`${type}\` | ${def ? `\`${def}\`` : '-'} | ${desc || '-'} |`
      })
      return [
        '| Prop | Type | Default | Description |',
        '| ---- | ---- | ------- | ----------- |',
        ...rows,
      ].join('\n')
    },
  )
}

async function replaceAsync(
  regex: RegExp,
  str: string,
  fn: (...args: string[]) => Promise<string>,
): Promise<string> {
  const matches = [...str.matchAll(regex)]
  let result = ''
  let last = 0
  for (const match of matches) {
    result += str.slice(last, match.index)
    result += await fn(...match)
    last = match.index + match[0].length
  }
  return result + str.slice(last)
}

/**
 * Build the processed Markdown for every doc and write it to `public/docs/<id>.md`.
 *
 * Runs at build time (from `next.config`), where `fs` is available. Cloudflare
 * Pages then serves these as plain static assets — the `.md` endpoint cannot be a
 * route handler because next-on-pages forces route handlers onto the Edge runtime,
 * which has no filesystem.
 */
export async function generateLlmMarkdownFiles(): Promise<void> {
  const docsDir = join(process.cwd(), 'docs')
  const outDir = join(process.cwd(), 'public', 'docs')
  const entries = await readdir(docsDir, { withFileTypes: true })
  // Start clean so renamed/removed docs don't leave stale .md files behind.
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const markdownById = new Map<string, string>()
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const docDir = join(docsDir, entry.name)
        let raw: string
        try {
          raw = await readFile(join(docDir, 'doc.mdx'), 'utf-8')
        } catch {
          // Not a documentation page (e.g. PMA plan/task folders); skip it.
          return
        }
        const markdown = await processMdxForLLMs(raw, docDir)
        markdownById.set(entry.name, markdown)
        await writeFile(join(outDir, `${entry.name}.md`), markdown, 'utf-8')
      }),
  )

  const registry = await readRegistry()
  const titles = collectDocTitles(registry)
  await writeLlmsFullFile(markdownById, titles)
  await writeLlmsIndexFile(markdownById, registry)
}

/**
 * Concatenate every processed doc into a single `public/llms-full.txt`, the
 * "entire guide in one file" companion to the `llms.txt` index. Sections are
 * ordered basic-doc pages first (Overview section order), then registry
 * components in registry.json order, then any remaining docs alphabetically.
 */
async function writeLlmsFullFile(
  markdownById: Map<string, string>,
  titles: Map<string, string>,
): Promise<void> {
  const ordered = orderDocIds([...markdownById.keys()], titles)

  const header =
    '# ikui\n\n' +
    `> ${SITE_DESCRIPTION}\n\n` +
    'This file contains the full text of every ikui documentation page, ' +
    'concatenated for LLM consumption. For a lighter index with links, see ' +
    '`/llms.txt`.\n'

  const sections = ordered.map((id) => {
    const title = titles.get(id) ?? toTitleCase(id)
    return `# ${title}\n\n${markdownById.get(id)?.trim() ?? ''}\n`
  })

  const content = `${[header, ...sections].join('\n---\n\n')}`
  await writeFile(
    join(process.cwd(), 'public', 'llms-full.txt'),
    content,
    'utf-8',
  )
}

/**
 * Build `public/llms.txt`, the link index that points at the per-page `.md`
 * files and the `llms-full.txt` bundle. Sections, titles, and the base URL are
 * all derived from `basic-doc`, `registry.json`, and the docs actually emitted,
 * so the index never drifts from what was generated. Companion to
 * `writeLlmsFullFile`; runs at build time alongside it.
 */
async function writeLlmsIndexFile(
  markdownById: Map<string, string>,
  registry: Registry | null,
): Promise<void> {
  const base = registry?.homepage ?? SITE_URL
  const lines: string[] = ['# ikui', '', `> ${SITE_DESCRIPTION}`, '']
  lines.push(
    `Install any component with the shadcn CLI, e.g. ` +
      `\`pnpx shadcn@latest add ${base}/r/copy-button.json\`. To use the ` +
      `\`@ikui\` namespace, add \`"@ikui": "${base}/r/{name}.json"\` to the ` +
      `\`registries\` field in your \`components.json\`.`,
    '',
  )

  // Overview: the basic-doc sections, limited to pages that were emitted.
  for (const section of basicDoc) {
    const items = section.items.filter((item) => markdownById.has(item.id))
    if (!items.length) {
      continue
    }
    lines.push(`## ${section.title}`, '')
    for (const item of items) {
      lines.push(
        `- [${item.title}](${base}/docs/${item.id}.md): ${item.description}`,
      )
    }
    lines.push('')
  }

  // Components: registry components that have a documentation page, in
  // registry.json order.
  const components = (registry?.items ?? []).filter(
    (item) => item.type === 'registry:component' && markdownById.has(item.name),
  )
  if (components.length) {
    lines.push('## Components', '')
    for (const item of components) {
      lines.push(
        `- [${item.title}](${base}/docs/${item.name}.md): ${item.description ?? ''}`,
      )
    }
    lines.push('')
  }

  lines.push(
    '## Optional',
    '',
    `- [Registry Index](${base}/r/registry.json): The shadcn registry manifest listing every installable ikui item.`,
    `- [llms-full.txt](${base}/llms-full.txt): The entire ikui documentation concatenated into a single file.`,
    `- [GitHub Repository](${GITHUB_URL}): Source code, issues, and contributions.`,
  )

  const content =
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  await writeFile(join(process.cwd(), 'public', 'llms.txt'), content, 'utf-8')
}

/** Read and parse `registry.json`; returns null when it is absent. */
async function readRegistry(): Promise<Registry | null> {
  try {
    const raw = await readFile(join(process.cwd(), 'registry.json'), 'utf-8')
    return JSON.parse(raw) as Registry
  } catch {
    return null
  }
}

/**
 * Map doc id → display title from basic-doc and the registry manifest, the two
 * sources the docs schema is assembled from at runtime.
 */
function collectDocTitles(registry: Registry | null): Map<string, string> {
  const titles = new Map<string, string>()
  for (const section of basicDoc) {
    for (const item of section.items) {
      titles.set(item.id, item.title)
    }
  }
  for (const item of registry?.items ?? []) {
    if (item.type === 'registry:component') {
      titles.set(item.name, item.title)
    }
  }
  return titles
}

/**
 * Order doc ids by basic-doc sequence, then registry component order (captured
 * in `titles` insertion order), then leftovers alphabetically.
 */
function orderDocIds(ids: string[], titles: Map<string, string>): string[] {
  const available = new Set(ids)
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const id of titles.keys()) {
    if (available.has(id) && !seen.has(id)) {
      ordered.push(id)
      seen.add(id)
    }
  }
  for (const id of [...ids].sort()) {
    if (!seen.has(id)) {
      ordered.push(id)
      seen.add(id)
    }
  }
  return ordered
}

function toTitleCase(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

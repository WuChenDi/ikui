import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
import { join, resolve } from 'path'

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
  await mkdir(outDir, { recursive: true })

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
        await writeFile(join(outDir, `${entry.name}.md`), markdown, 'utf-8')
      }),
  )
}

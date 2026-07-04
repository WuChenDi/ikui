// Regenerate the tsconfig `@/components/*` and `@/lib/*` aliases for the
// registry primitives from the files present in `registry/ikui/`.
//
// These aliases keep the shadcn copy convention working inside this repo: a
// registry component that imports a sibling via `@/components/<name>` (as it
// would in a consumer's project) resolves to `registry/ikui/<name>.tsx` here.
// Deriving them from disk means adding a component no longer requires editing
// tsconfig.json by hand. Wired into `pnpm registry:build`.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const registryDir = join(root, 'registry', 'ikui')
const tsconfigPath = join(root, 'tsconfig.json')

// Hand-maintained aliases, preserved verbatim. Everything matching the
// generated shape below (`@/components/<name>` or `@/lib/<name>`, single file)
// is rebuilt from the registry directory on every run.
const STATIC_LEADING = ['@/docs/*']
const STATIC_TRAILING = ['@/*']

const isGeneratedKey = (key) => /^@\/(?:components|lib)\/[^*]+$/.test(key)

const files = readdirSync(registryDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
  .map((entry) => entry.name)
  .sort()

const generated = {}
for (const file of files) {
  const name = file.replace(/\.tsx?$/, '')
  const alias = file.endsWith('.tsx') ? `@/components/${name}` : `@/lib/${name}`
  generated[alias] = [`./registry/ikui/${file}`]
}

const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
const existing = tsconfig.compilerOptions.paths ?? {}

const rebuilt = {}
for (const key of STATIC_LEADING) {
  if (existing[key]) {
    rebuilt[key] = existing[key]
  }
}
// Preserve any other hand-maintained alias (non-static, non-generated) in place.
for (const [key, value] of Object.entries(existing)) {
  if (
    STATIC_LEADING.includes(key) ||
    STATIC_TRAILING.includes(key) ||
    isGeneratedKey(key)
  ) {
    continue
  }
  rebuilt[key] = value
}
for (const [key, value] of Object.entries(generated)) {
  rebuilt[key] = value
}
for (const key of STATIC_TRAILING) {
  if (existing[key]) {
    rebuilt[key] = existing[key]
  }
}

tsconfig.compilerOptions.paths = rebuilt
writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`)

// Normalize to Biome's canonical JSON formatting so the committed file and
// `pnpm lint` stay in agreement no matter who runs this script.
execFileSync(
  join(root, 'node_modules', '.bin', 'biome'),
  ['format', '--write', tsconfigPath],
  { stdio: 'inherit' },
)

console.log(
  `tsconfig paths: regenerated ${Object.keys(generated).length} registry aliases`,
)

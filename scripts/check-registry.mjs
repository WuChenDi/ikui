// Registry integrity check. This repo has no unit-test suite, so this guards
// the invariants that would otherwise only break at install/build time:
//   1. every file declared in registry.json exists on disk;
//   2. every `@ikui/*` registryDependency points at a real registry item
//      (bare names / other namespaces are external shadcn refs — accepted);
//   3. every documented component (`registry:component`) has its doc + demo.
// Wired into `pnpm registry:check` and run in CI.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'))
const items = registry.items ?? []
const names = new Set(items.map((item) => item.name))
const errors = []

// (1) declared files exist
for (const item of items) {
  for (const file of item.files ?? []) {
    if (!existsSync(join(root, file.path))) {
      errors.push(`${item.name}: missing file "${file.path}"`)
    }
  }
}

// (2) internal registry dependencies resolve
for (const item of items) {
  for (const dep of item.registryDependencies ?? []) {
    if (dep.startsWith('@ikui/')) {
      const target = dep.slice('@ikui/'.length)
      if (!names.has(target)) {
        errors.push(
          `${item.name}: registryDependency "${dep}" has no matching item`,
        )
      }
    }
  }
}

// (3) documented components have doc.mdx + demo.tsx
for (const item of items) {
  if (item.type !== 'registry:component') {
    continue
  }
  const docDir = join(root, 'docs', item.name)
  if (!existsSync(join(docDir, 'doc.mdx'))) {
    errors.push(`${item.name}: missing docs/${item.name}/doc.mdx`)
  }
  if (!existsSync(join(docDir, 'demo.tsx'))) {
    errors.push(`${item.name}: missing docs/${item.name}/demo.tsx`)
  }
}

if (errors.length > 0) {
  console.error(`registry:check FAILED — ${errors.length} problem(s):`)
  for (const error of errors) {
    console.error(`  - ${error}`)
  }
  process.exit(1)
}

console.log(
  `registry:check OK — ${items.length} items; all files, deps and docs present`,
)

import { CopyButton } from '@/registry/ikui/copy-button'

export function Demo() {
  return (
    <div className="flex items-center gap-4">
      <CopyButton value="Copied with a label">Copy</CopyButton>
      <CopyButton value="Copied with a label" copiedChildren="Copied!">
        Copy
      </CopyButton>
    </div>
  )
}

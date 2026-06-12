import { codeToHtml } from 'shiki'

/**
 * Highlight a code string to dual-theme HTML, matching the MDX pipeline
 * (`github-light` / `github-dark`, `defaultColor: false`). The emitted
 * `.shiki` markup is colored by the global rules in `globals.css`.
 */
export async function highlightCode(
  code: string,
  lang = 'tsx',
): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}

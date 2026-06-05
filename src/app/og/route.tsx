import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config'

export const runtime = 'edge'

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function loadLogo(origin: string): Promise<string> {
  const logoSvg = await fetch(new URL('/ikui/logo.svg', origin)).then((res) =>
    res.text(),
  )
  const logoSvgWhite = logoSvg.replace(/(fill|stroke)="black"/g, '$1="white"')
  return `data:image/svg+xml,${encodeURIComponent(logoSvgWhite)}`
}

async function loadAssets(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: 'normal' }[]
> {
  const [
    { base64Font: normal },
    { base64Font: medium },
    { base64Font: semibold },
  ] = await Promise.all([
    import('./geist-regular.json').then((mod) => mod.default || mod),
    import('./geist-medium.json').then((mod) => mod.default || mod),
    import('./geist-semibold.json').then((mod) => mod.default || mod),
  ])

  return [
    {
      name: 'Geist',
      data: base64ToArrayBuffer(normal),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Geist',
      data: base64ToArrayBuffer(medium),
      weight: 500,
      style: 'normal',
    },
    {
      name: 'Geist',
      data: base64ToArrayBuffer(semibold),
      weight: 600,
      style: 'normal',
    },
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const description = searchParams.get('description')

  const [fonts, logoUrl] = await Promise.all([
    loadAssets(),
    loadLogo(request.url),
  ])

  return new ImageResponse(
    <div
      tw="flex h-full w-full bg-[#0a0a0a] text-zinc-50"
      style={{ fontFamily: 'Geist' }}
    >
      <div tw="flex border absolute border-neutral-800 border-dashed inset-y-0 left-16 w-[1px]" />
      <div tw="flex border absolute border-neutral-800 border-dashed inset-y-0 right-16 w-[1px]" />
      <div tw="flex border absolute border-neutral-800 inset-x-0 h-[1px] top-16" />
      <div tw="flex border absolute border-neutral-800 inset-x-0 h-[1px] bottom-16" />
      <div tw="flex flex-col absolute justify-center items-center inset-0 p-30 w-full h-full">
        {title || description ? (
          <div tw="flex flex-col items-start justify-between text-start w-full h-full">
            {/* biome-ignore lint/performance/noImgElement: satori OG image rendering requires a plain <img> */}
            <img src={logoUrl} width={64} height={68} alt="" />
            <div tw="flex flex-col">
              <div tw="text-zinc-50 flex text-7xl font-medium tracking-tight">
                {title || siteConfig.name}
              </div>
              <div tw="text-zinc-400 text-4xl flex mt-10 tracking-tight">
                {description || siteConfig.description}
              </div>
            </div>
          </div>
        ) : (
          <div tw="flex flex-col items-start justify-between text-start w-full h-full">
            {/* biome-ignore lint/performance/noImgElement: satori OG image rendering requires a plain <img> */}
            <img src={logoUrl} width={64} height={68} alt="" />
            <div tw="flex flex-col">
              <div tw="text-zinc-50 flex text-7xl font-medium tracking-tight">
                {siteConfig.name}
              </div>
              <div tw="text-zinc-400 text-4xl flex mt-10 tracking-tight">
                {siteConfig.description}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 628,
      fonts,
      headers: {
        'Cache-Control':
          process.env.NODE_ENV === 'development'
            ? 'no-store'
            : 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}

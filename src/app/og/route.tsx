import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config'

export const runtime = 'edge'

const logoSvg = `<svg width="64" height="68" viewBox="138 111 261 290" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="174" cy="150" r="30" fill="white"/><g stroke="white" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"><path d="M174 218V368"/><path d="M294 144V368"/><path d="M294 300L362 232"/><path d="M294 300L366 368"/></g></svg>`

const logoUrl = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function loadAssets(): Promise<
  {
    name: string
    data: ArrayBuffer
    weight: 400 | 500 | 600
    style: 'normal'
  }[]
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
  const title = searchParams.get('title') || siteConfig.name
  const description = searchParams.get('description') || siteConfig.description

  const headers = {
    'Cache-Control':
      process.env.NODE_ENV === 'development'
        ? 'no-store'
        : 'public, max-age=3600, s-maxage=3600',
  }

  try {
    const fonts = await loadAssets()

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
          <div tw="flex flex-col items-start justify-between text-start w-full h-full">
            {/* biome-ignore lint/performance/noImgElement: satori OG image rendering requires a plain <img> */}
            <img src={logoUrl} width={64} height={68} alt="" />
            <div tw="flex flex-col">
              <div tw="text-zinc-50 flex text-7xl font-medium tracking-tight">
                {title}
              </div>
              <div tw="text-zinc-400 text-4xl flex mt-10 tracking-tight">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 628,
        fonts,
        headers,
      },
    )
  } catch {
    // Fallback: render without custom fonts/logo if asset loading fails,
    // so the route never 500s (fonts live in large JSON imports at the edge).
    return new ImageResponse(
      <div tw="flex flex-col items-center justify-center h-full w-full bg-[#0a0a0a] text-zinc-50">
        <div tw="flex text-7xl font-bold tracking-tight">{title}</div>
        <div tw="flex text-zinc-400 text-4xl mt-8 tracking-tight text-center px-24">
          {description}
        </div>
      </div>,
      {
        width: 1200,
        height: 628,
        headers,
      },
    )
  }
}

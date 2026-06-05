import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { default: content } = await import(`@/docs/${id}/doc.mdx?raw`)

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}

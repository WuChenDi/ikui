'use client'

import { Download } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { QRCodeHandle } from '@/registry/ikui/qr-code'
import { QRCode } from '@/registry/ikui/qr-code'

type Mode = 'svg' | 'canvas'

export function Demo() {
  const qrRef = React.useRef<QRCodeHandle>(null)
  const [mode, setMode] = React.useState<Mode>('svg')

  return (
    <div className="flex flex-col items-center gap-4">
      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <TabsList>
          <TabsTrigger value="svg">SVG</TabsTrigger>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
        </TabsList>
      </Tabs>
      <QRCode
        ref={qrRef}
        type={mode}
        value="https://ik-ui.pages.dev"
        size={160}
        fgColor="#0f172a"
        bgColor="#ffffff"
        marginSize={2}
        bordered
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => qrRef.current?.download()}
      >
        <Download className="size-4" aria-hidden />
        Download {mode === 'canvas' ? 'PNG' : 'SVG'}
      </Button>
    </div>
  )
}

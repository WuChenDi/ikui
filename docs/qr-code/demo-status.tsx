'use client'

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRCode } from '@/registry/ikui/qr-code'

const states = ['active', 'loading', 'expired', 'scanned'] as const
type Status = (typeof states)[number]

export function Demo() {
  const [status, setStatus] = React.useState<Status>('expired')

  return (
    <div className="flex flex-col items-center gap-4">
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as Status)}
      >
        <TabsList>
          {states.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QRCode
        value="https://ik-ui.pages.dev"
        size={160}
        status={status}
        onRefresh={() => setStatus('active')}
        bordered
      />
    </div>
  )
}

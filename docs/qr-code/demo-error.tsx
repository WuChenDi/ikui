import { QRCode } from '@/registry/ikui/qr-code'

const levels = ['L', 'M', 'Q', 'H'] as const

export function Demo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {levels.map((level) => (
        <QRCode
          key={level}
          value="https://ik-ui.pages.dev"
          size={120}
          errorLevel={level}
          bordered
        />
      ))}
    </div>
  )
}

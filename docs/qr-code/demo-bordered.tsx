import { QRCode } from '@/registry/ikui/qr-code'

export function Demo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <QRCode value="https://ik-ui.pages.dev" size={140} />
      <QRCode value="https://ik-ui.pages.dev" size={140} bordered />
    </div>
  )
}

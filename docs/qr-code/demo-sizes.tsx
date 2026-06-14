import { QRCode } from '@/registry/ikui/qr-code'

export function Demo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      <QRCode value="https://ik-ui.pages.dev" size={96} bordered />
      <QRCode value="https://ik-ui.pages.dev" size={140} bordered />
      <QRCode value="https://ik-ui.pages.dev" size={180} bordered />
    </div>
  )
}

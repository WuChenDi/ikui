import { QRCode } from '@/registry/ikui/qr-code'

export function Demo() {
  return (
    <QRCode
      type="canvas"
      value="https://ik-ui.pages.dev"
      size={160}
      fgColor="#0f172a"
      bgColor="#ffffff"
      marginSize={2}
      bordered
    />
  )
}

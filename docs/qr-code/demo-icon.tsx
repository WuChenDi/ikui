import { QRCode } from '@/registry/ikui/qr-code'

export function Demo() {
  return (
    <QRCode
      value="https://ik-ui.pages.dev"
      size={160}
      icon="/icon.svg"
      iconSize={40}
      errorLevel="H"
      marginSize={2}
      bordered
    />
  )
}

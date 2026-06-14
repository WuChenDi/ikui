import { QRCode } from '@/registry/ikui/qr-code'

export function Demo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="w-[105px] rounded-lg p-2 shadow-[0_0_0_1px_rgba(0,0,0,.08),_0px_2px_2px_rgba(0,0,0,.04)] md:w-[140px] dark:border dark:border-input [&_svg]:h-auto [&_svg]:w-full">
        <QRCode
          value="https://ik-ui.pages.dev"
          size={140}
          fgColor="#c2410c"
          bgColor="var(--background)"
        />
      </div>
      <div className="w-[105px] rounded-lg p-2 shadow-[0_0_0_1px_rgba(0,0,0,.08),_0px_2px_2px_rgba(0,0,0,.04)] md:w-[140px] dark:border dark:border-input [&_svg]:h-auto [&_svg]:w-full">
        <QRCode
          value="https://ik-ui.pages.dev"
          size={140}
          fgColor="#1d4ed8"
          bgColor="var(--background)"
        />
      </div>
      <div className="w-[105px] rounded-lg p-2 shadow-[0_0_0_1px_rgba(0,0,0,.08),_0px_2px_2px_rgba(0,0,0,.04)] md:w-[140px] dark:border dark:border-input [&_svg]:h-auto [&_svg]:w-full">
        <QRCode
          value="https://ik-ui.pages.dev"
          size={140}
          fgColor="#15803d"
          bgColor="var(--background)"
        />
      </div>
    </div>
  )
}

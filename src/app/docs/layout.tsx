import { AppSidebar } from '@/components/app-sidebar'
import SiteHeader from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getDocSchema } from '@/lib/doc'

const docSchema = await getDocSchema()

export default function DocLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <SidebarProvider className="flex flex-col">
        <SiteHeader docSchema={docSchema} />
        <div className="3xl:max-w-screen-2xl mx-auto flex w-full pt-14">
          <AppSidebar docSchema={docSchema} />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

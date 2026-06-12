'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { DocSchema } from '@/lib/types'

export function AppSidebar({
  docSchema,
  ...props
}: ComponentProps<typeof Sidebar> & {
  docSchema: DocSchema
}) {
  const pathname = usePathname()
  const { toggleSidebar, isMobile } = useSidebar()
  const data = {
    navMain: docSchema,
  }

  return (
    <Sidebar className="mt-14 border-none" {...props}>
      {/* mt-14 > for header height */}
      <SidebarContent
        className="max-h-[calc(100vh-100px)] overflow-y-auto"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.2) 1rem, black 2rem, black calc(100% - 2rem), rgba(0,0,0,0.2) calc(100% - 1rem), transparent 100%)',
        }}
      >
        <div className="h-4 shrink-0" />
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((navItem) => (
                  <SidebarMenuItem key={navItem.id}>
                    <SidebarMenuButton
                      className="data-[active=true]:shadow-[0_0_0_1px_rgba(0,0,0,.08),_0px_2px_2px_rgba(0,0,0,.04)] data-[active=true]:not-dark:bg-white transition-all"
                      isActive={
                        !navItem.href && pathname === `/docs/${navItem.id}`
                      }
                      onClick={() => {
                        if (isMobile) {
                          toggleSidebar()
                        }
                      }}
                      render={
                        navItem.href ? (
                          <a
                            href={navItem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ) : (
                          <Link href={`/docs/${navItem.id}`} />
                        )
                      }
                    >
                      {navItem.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <div className="h-4 shrink-0" />
      </SidebarContent>
    </Sidebar>
  )
}

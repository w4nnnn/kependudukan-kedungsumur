"use client"

import * as React from "react"
import { Users, UserCog, LogOut, Contact2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  
  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border/10">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Users className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Kependudukan</span>
                <span className="text-xs text-muted-foreground">Desa Kedungsumur</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="bg-border/10" />
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <a href="/kependudukan">
                  <Users />
                  <span>Penduduk</span>
                </a>
              }
              isActive={pathname.startsWith("/kependudukan")}
              tooltip="Data Penduduk"
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <a href="/kk">
                  <Contact2 />
                  <span>Kartu Keluarga</span>
                </a>
              }
              isActive={pathname.startsWith("/kk")}
              tooltip="Data Kartu Keluarga"
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <a href="/pengguna">
                  <UserCog />
                  <span>Pengguna</span>
                </a>
              }
              isActive={pathname.startsWith("/pengguna")}
              tooltip="Manajemen Pengguna"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Card className="flex flex-col gap-3 p-3 bg-white/5 border-white/10 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent shadow-none">
          {session?.user && (
            <div className="flex flex-col gap-0.5 px-1 opacity-90 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Masuk sebagai</span>
              <span className="text-sm font-semibold truncate text-foreground">{session.user.name}</span>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                render={
                  <button onClick={handleLogout} className="border-2 border-destructive/20">
                    <LogOut />
                    <span>Keluar</span>
                  </button>
                }
                className="text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
                tooltip="Keluar"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </Card>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

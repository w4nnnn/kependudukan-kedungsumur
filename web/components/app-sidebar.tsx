"use client"

import * as React from "react"
import { LayoutDashboard, Users, UserCog, LogOut, Contact2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  
  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="py-4 bg-sidebar">
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
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarContent className="px-3 py-4 bg-sidebar">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4 shrink-0" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              }
              isActive={pathname === "/dashboard"}
              tooltip="Statistik & Dashboard"
              className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                pathname === "/dashboard"
                  ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                  : "border-2 border-sidebar-border bg-card hover:border-primary/40 hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <Link href="/kependudukan">
                  <Users className="size-4 shrink-0" />
                  <span className="font-medium">Penduduk</span>
                </Link>
              }
              isActive={pathname.startsWith("/kependudukan")}
              tooltip="Data Penduduk"
              className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                pathname.startsWith("/kependudukan")
                  ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                  : "border-2 border-sidebar-border bg-card hover:border-primary/40 hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              render={
                <Link href="/kk">
                  <Contact2 className="size-4 shrink-0" />
                  <span className="font-medium">Kartu Keluarga</span>
                </Link>
              }
              isActive={pathname.startsWith("/kk")}
              tooltip="Data Kartu Keluarga"
              className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                pathname.startsWith("/kk")
                  ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                  : "border-2 border-sidebar-border bg-card hover:border-primary/40 hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            />
          </SidebarMenuItem>
          {session?.user && (session.user as any).role === "admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                render={
                  <Link href="/pengguna">
                    <UserCog className="size-4 shrink-0" />
                    <span className="font-medium">Pengguna</span>
                  </Link>
                }
                isActive={pathname.startsWith("/pengguna")}
                tooltip="Manajemen Pengguna"
                className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  pathname.startsWith("/pengguna")
                    ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                    : "border-2 border-sidebar-border bg-card hover:border-primary/40 hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
              />
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 bg-sidebar">
        <div className="flex flex-col gap-3 p-3.5 rounded-xl border-2 border-sidebar-border bg-card group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:border-transparent shadow-xs">
          {session?.user && (
            <div className="flex flex-col gap-0.5 px-0.5 group-data-[collapsible=icon]:hidden">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Masuk sebagai</span>
              <span className="text-sm font-bold truncate text-foreground">{session.user.name}</span>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                render={
                  <button onClick={handleLogout}>
                    <LogOut className="size-4 shrink-0" />
                    <span className="font-medium">Keluar</span>
                  </button>
                }
                className="rounded-lg border-2 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 group-data-[collapsible=icon]:justify-center"
                tooltip="Keluar"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

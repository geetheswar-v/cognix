"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconBook,
  IconBrain,
  IconDashboard,
  IconFlask,
  IconInnerShadowTop,
  IconReport,
} from "@tabler/icons-react"

import { Logo } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type MainShellProps = {
  children: React.ReactNode
  userName: string
  userEmail: string
}

const mainNav = [
  { title: "Dashboard", href: "/", icon: IconDashboard },
  { title: "Exams", href: "/exams", icon: IconFlask },
  { title: "Review", href: "/review", icon: IconReport },
]

const subjectsNav = [
  { title: "Physics", href: "/exams/physics", icon: IconInnerShadowTop },
  { title: "Chemistry", href: "/exams/chemistry", icon: IconFlask },
  { title: "Botany", href: "/exams/botany", icon: IconBook },
  { title: "Zoology", href: "/exams/zoology", icon: IconBrain },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function MainShell({ children, userName, userEmail }: MainShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border/80">
          <Logo />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                      isActive={isActive(pathname, item.href)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Subjects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {subjectsNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                      isActive={isActive(pathname, item.href)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/70 px-3 py-2">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/75">{userEmail}</p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Cognix Dashboard</p>
            <p className="text-xs text-muted-foreground">
              Productive NEET preparation workspace
            </p>
          </div>
          <span className="ml-auto rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
            Live
          </span>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconBook,
  IconBrain,
  IconDashboard,
  IconFlask,
  IconInnerShadowTop,
  IconLogout,
  IconReport,
} from "@tabler/icons-react"

import { signOut } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const router = useRouter()

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in")
          router.refresh()
        },
      },
    })
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border/80">
          <Logo collapseAware />
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button />}
            >
              <div className="flex items-center gap-4">
                <Avatar size="default" className="shrink-0">
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-start group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/75">
                    {userEmail}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
                <IconLogout className="size-4" />
                Sign out
              </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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

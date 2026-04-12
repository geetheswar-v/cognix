"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAtom,
  IconBook2,
  IconDna2,
  IconFlask2,
  IconLeaf,
  IconLayoutDashboard,
  IconLogout,
} from "@tabler/icons-react"

import { Logo } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/auth-client"

const menu = [
  {
    label: "Dashboard",
    href: "/",
    icon: IconLayoutDashboard,
  },
  {
    label: "Exams",
    href: "/exams",
    icon: IconBook2,
    children: [
      { label: "Physics", href: "/exams/physics", icon: IconAtom },
      { label: "Chemistry", href: "/exams/chemistry", icon: IconFlask2 },
      { label: "Botany", href: "/exams/botany", icon: IconLeaf },
      { label: "Zoology", href: "/exams/zoology", icon: IconDna2 },
    ],
  },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border/70">
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="rounded-xl p-2 transition-colors hover:bg-sidebar-accent">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {menu.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.children ? (
                    <SidebarMenuSub>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              render={<Link href={child.href} />}
                              isActive={isActivePath(pathname, child.href)}
                            >
                              <ChildIcon />
                              <span>{child.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="text-rose-700 hover:bg-rose-100/70 hover:text-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
            >
              <IconLogout />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

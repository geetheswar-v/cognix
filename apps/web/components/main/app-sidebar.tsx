"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAtom,
  IconChecks,
  IconDna2,
  IconFlask2,
  IconLeaf,
  IconLayoutDashboard,
  IconLogout,
} from "@tabler/icons-react"

import { Logo } from "@/components/logo"
import { SUBJECT_IDS, SUBJECTS } from "@/components/main/types"
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

const subjectIcons = {
  physics: IconAtom,
  chemistry: IconFlask2,
  botany: IconLeaf,
  zoology: IconDna2,
}

const menu = [
  {
    label: "Dashboard",
    href: "/",
    icon: IconLayoutDashboard,
  },
  {
    label: "Exams",
    href: "/exams",
    icon: IconChecks,
    children: SUBJECT_IDS.map((id) => ({
      label: SUBJECTS[id].label,
      href: `/exams/${id}`,
      icon: subjectIcons[id],
    })),
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
    <Sidebar variant="inset" className="border-r border-sidebar-border/70 bg-sidebar/70">
      <SidebarHeader className="px-4 py-5">
        <Link
          href="/"
          className="rounded-xl p-2 transition-colors hover:bg-sidebar-accent"
        >
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menu.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={active}
                  >
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
            <SidebarMenuButton onClick={() => signOut()} variant="outline">
              <IconLogout />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

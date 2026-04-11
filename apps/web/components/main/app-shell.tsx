"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { IconBell, IconSearch } from "@tabler/icons-react"

import { AppSidebar } from "@/components/main/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

type AppShellProps = {
  children: React.ReactNode
  userName: string
}

function titleForPath(pathname: string) {
  if (pathname === "/") return "Dashboard"
  if (pathname === "/exams") return "Exams"
  if (pathname.startsWith("/exams/physics")) return "Physics"
  if (pathname.startsWith("/exams/chemistry")) return "Chemistry"
  if (pathname.startsWith("/exams/botany")) return "Botany"
  if (pathname.startsWith("/exams/zoology")) return "Zoology"
  return "Workspace"
}

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname()

  const title = useMemo(() => titleForPath(pathname), [pathname])
  const initial = useMemo(() => userName.trim().charAt(0).toUpperCase() || "U", [userName])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-[radial-gradient(circle_at_5%_0%,color-mix(in_oklch,var(--primary)_14%,white)_0%,transparent_45%),radial-gradient(circle_at_95%_20%,color-mix(in_oklch,var(--chart-2)_14%,white)_0%,transparent_38%)]">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:h-20 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Cognix Practice
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 lg:flex">
              <IconSearch className="size-4 text-muted-foreground" />
              <Input
                aria-label="Search topics"
                placeholder="Search topics"
                className="h-7 w-44 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button size="icon-sm" variant="ghost" className="rounded-full">
              <IconBell />
            </Button>
            <div className="grid size-9 place-items-center rounded-full border border-primary/25 bg-primary/15 text-sm font-semibold text-primary">
              {initial}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

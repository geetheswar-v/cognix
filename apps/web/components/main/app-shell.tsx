"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconBell, IconChevronRight } from "@tabler/icons-react"

import { AppSidebar } from "@/components/main/app-sidebar"
import { SUBJECTS, isSubjectId } from "@/components/main/types"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type AppShellProps = {
  children: React.ReactNode
  userName: string
}

function titleForPath(pathname: string) {
  if (pathname === "/") return "Dashboard"
  if (pathname === "/exams") return "Exams"

  const [, first, second] = pathname.split("/")
  if (first === "exams" && second && isSubjectId(second)) {
    return SUBJECTS[second].label
  }

  return "Workspace"
}

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname()

  const title = useMemo(() => titleForPath(pathname), [pathname])
  const subtitle = useMemo(() => {
    if (pathname === "/") return "Daily progress and planning"
    if (pathname.startsWith("/exams")) return "Practice tests and review"
    return "Learning workspace"
  }, [pathname])
  const initial = useMemo(
    () => userName.trim().charAt(0).toUpperCase() || "U",
    [userName]
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-18">
            <SidebarTrigger className="md:hidden" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link
                  href="/"
                  className="font-medium transition-colors hover:text-foreground"
                >
                  Cognix
                </Link>
                <IconChevronRight className="opacity-70" />
                <span className="truncate">{title}</span>
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {subtitle}
              </h1>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              aria-label="Notifications"
            >
              <IconBell />
            </Button>
            <div className="grid size-9 place-items-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
              {initial}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

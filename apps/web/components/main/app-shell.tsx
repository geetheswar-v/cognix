"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconBell,
  IconChevronRight,
  IconClipboardCheck,
} from "@tabler/icons-react"

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
  if (pathname.startsWith("/exams/review/")) return "Review"
  if (pathname.startsWith("/exams/take/")) return "Take Exam"

  const [, first, second] = pathname.split("/")
  if (first === "exams" && second && isSubjectId(second)) {
    return SUBJECTS[second].label
  }

  return "Workspace"
}

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname()

  const title = useMemo(() => titleForPath(pathname), [pathname])
  const description = useMemo(() => {
    if (pathname === "/") return "Daily progress and planning"
    if (pathname === "/exams") return "Start tests and review your attempts"
    if (pathname.startsWith("/exams/review/")) return "Detailed answer analysis"
    if (pathname.startsWith("/exams/take/")) return "Focused attempt in progress"
    return "Chapter-wise preparation"
  }, [pathname])
  const initial = useMemo(
    () => userName.trim().charAt(0).toUpperCase() || "U",
    [userName]
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="flex h-17 items-center gap-3 px-4 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link
                  href="/"
                  className="font-medium transition-colors hover:text-foreground"
                >
                  Cognix Workspace
                </Link>
                <IconChevronRight className="opacity-70" />
                <span className="truncate">{title}</span>
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {description}
              </h1>
            </div>
            <Button
              render={<Link href="/exams" />}
              variant="outline"
              className="hidden rounded-2xl md:inline-flex"
            >
              <IconClipboardCheck data-icon="inline-start" />
              Open Exams
            </Button>
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
        <div className="flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

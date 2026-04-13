import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft, IconBook2, IconCircleCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

export default async function TakeExamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="flex h-15 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/exams" />}
              variant="ghost"
              size="sm"
              className="rounded-2xl"
            >
              <IconArrowLeft data-icon="inline-start" />
              Back
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <IconBook2 />
              Exam Workspace
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {session.user.name}
            </span>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <IconCircleCheck />
              Secure session
            </div>
            <div className="grid size-8 place-items-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  )
}

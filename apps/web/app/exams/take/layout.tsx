import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"

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
    <div className="flex min-h-svh flex-col bg-background select-none user-select-none">
      <header className="sticky top-0 z-30 flex-shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold tracking-tight text-foreground">Cognix Exam</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {session.user.name}
            </span>
            <div className="grid size-8 place-items-center rounded-full border border-primary/25 bg-primary/15 text-xs font-semibold text-primary">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
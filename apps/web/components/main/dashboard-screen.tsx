import Link from "next/link"
import {
  IconArrowRight,
  IconCalendarStats,
  IconChartBar,
  IconClock,
  IconTargetArrow,
} from "@tabler/icons-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function DashboardScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-primary-foreground shadow-lg shadow-primary/15 sm:p-8">
        <div className="absolute -top-20 -right-16 size-56 rounded-full bg-white/12 blur-2xl" />
        <div className="absolute -bottom-28 left-16 size-64 rounded-full bg-black/10 blur-2xl" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary-foreground/75 uppercase">
            Daily Challenge
          </p>
          <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Stay exam-ready with one focused NEET test every day.
          </h2>
          <p className="text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Take the latest full test and keep your preparation rhythm steady.
            Detailed review data will appear as soon as your attempts are saved.
          </p>
          <Link
            href="/exams"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "rounded-2xl bg-white text-slate-900 hover:bg-white/90"
            )}
          >
            Open Exams
            <IconArrowRight />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-border/70 bg-card/90 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IconTargetArrow className="size-4 text-primary" />
              Tests Planned
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-3xl font-semibold tracking-tight">1</p>
            <p className="mt-1 text-sm text-muted-foreground">Latest full test available</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-card/90 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IconClock className="size-4 text-primary" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-3xl font-semibold tracking-tight">45m</p>
            <p className="mt-1 text-sm text-muted-foreground">Recommended daily session</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-card/90 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IconCalendarStats className="size-4 text-primary" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-3xl font-semibold tracking-tight">Daily</p>
            <p className="mt-1 text-sm text-muted-foreground">Practice cadence target</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border border-border/70 bg-card/90 py-0">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconChartBar className="size-4 text-primary" />
            Performance widgets coming next
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-sm leading-relaxed text-muted-foreground">
          We skipped score analytics for now as requested. Once student review
          endpoints are fully wired, this dashboard will show subject-wise
          accuracy, weak areas, and streak trends.
        </CardContent>
      </Card>
    </div>
  )
}

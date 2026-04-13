import Link from "next/link"
import {
  IconActivity,
  IconArrowRight,
  IconBook2,
  IconChecklist,
  IconClock,
  IconStars,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DashboardScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary to-primary/85 p-6 text-primary-foreground shadow-xl shadow-primary/15 sm:p-8">
        <div className="absolute -top-16 right-8 size-44 rounded-full bg-white/12 blur-2xl" />
        <div className="absolute -bottom-20 -left-8 size-56 rounded-full bg-black/18 blur-3xl" />
        <div className="relative z-10 flex max-w-3xl flex-col gap-5">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground/75">
            Student Home
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Practice smart, review fast, and improve every attempt.
          </h2>
          <p className="max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
            Start your latest full test, revisit attempted papers, and sharpen
            weak chapters with consistent daily flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              render={<Link href="/exams/take/full" />}
              variant="secondary"
              className="rounded-2xl"
            >
              Start Full Test
              <IconArrowRight data-icon="inline-end" />
            </Button>
            <Button
              render={<Link href="/exams" />}
              variant="outline"
              className="rounded-2xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              View Attempts
              <IconChecklist data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBook2 className="text-primary" />
              Full Test Ready
            </CardTitle>
            <CardDescription>Latest paper available now</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">1</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconClock className="text-primary" />
              Focus Duration
            </CardTitle>
            <CardDescription>Recommended daily session</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">45 min</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconStars className="text-primary" />
              Attempt Strategy
            </CardTitle>
            <CardDescription>Target one test per day</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">Daily</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border border-border/70 bg-card/95">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconActivity className="text-primary" />
            Performance Tracking
          </CardTitle>
          <CardDescription>
            Attempt reviews are already active. Detailed trend analytics can be
            added next.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Use the Exams page to open your previous attempts, inspect selected and
          correct options, and revise explanations chapter by chapter.
        </CardContent>
      </Card>
    </div>
  )
}

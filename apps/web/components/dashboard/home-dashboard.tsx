"use client"

import Link from "next/link"
import {
  IconArrowRight,
  IconBook2,
  IconChecklist,
  IconRefresh,
  IconReportSearch,
  IconTargetArrow,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl xl:col-span-2" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  )
}

export function HomeDashboard() {
  const {
    latestFullExam,
    chapterTests,
    reviewAttempts,
    isLoading,
    isRefreshing,
    refresh,
  } = useDashboardData()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_oklch,var(--chart-2)_23%,transparent),transparent_34%),radial-gradient(circle_at_15%_80%,color-mix(in_oklch,var(--primary)_19%,transparent),transparent_45%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Your NEET mission control
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Launch fresh tests, monitor your latest outcomes, and revisit
              mistakes through focused review cycles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
              <IconRefresh className="size-4" />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Button render={<Link href="/exams" />}>
              Browse Exams <IconArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconChecklist className="size-5 text-primary" /> Latest Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestFullExam ? (
              <div className="rounded-2xl border border-border/80 bg-background/65 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Latest Full NEET Exam</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created on {formatDate(latestFullExam.createdAt)}
                    </p>
                  </div>
                  <Button render={<Link href={`/exam/${latestFullExam.id}`} />}>Start</Button>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-semibold">{latestFullExam.totalQuestions}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">Correct</p>
                    <p className="font-semibold">+{latestFullExam.scoring.correct}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">Wrong</p>
                    <p className="font-semibold">{latestFullExam.scoring.wrong}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">Unattempted</p>
                    <p className="font-semibold">{latestFullExam.scoring.unattempted}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">No latest full exam available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Once generated, it will appear here with one-click start.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconTargetArrow className="size-5 text-primary" /> Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewAttempts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm font-medium">No reviewed attempts yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit an exam to unlock detailed answer review.
                </p>
              </div>
            ) : (
              reviewAttempts.slice(0, 5).map((attempt) => (
                <Link
                  key={attempt.attemptId}
                  href={`/review/${attempt.examId}`}
                  className="block rounded-2xl border border-border/80 bg-background/70 p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {attempt.examType === "full" ? "Full Test" : "Chapter Test"}
                    </p>
                    <p className="text-sm font-semibold">{attempt.score} marks</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {attempt.subject ? `${attempt.subject} · ` : ""}
                    {attempt.chapter ?? "General"}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconBook2 className="size-5 text-primary" /> Latest Chapter Tests
            </CardTitle>
            <Button variant="outline" render={<Link href="/exams" />}>
              See all
            </Button>
          </CardHeader>
          <CardContent>
            {chapterTests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">No chapter tests available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chapter exams will be listed here as soon as they are ready.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {chapterTests.slice(0, 9).map((test) => (
                  <article
                    key={test.examId}
                    className="rounded-2xl border border-border/80 bg-background/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{test.chapter ?? "Chapter test"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {test.subject ?? "Subject"}
                        </p>
                      </div>
                      <span className="rounded-full border border-border px-2 py-1 text-xs">
                        {test.questions} Q
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {formatDate(test.createdAt)}
                    </p>
                    <Button
                      className="mt-3"
                      variant="outline"
                      render={<Link href={`/exam/${test.examId}`} />}
                    >
                      Start chapter test
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Performance Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Spend at least one review cycle after every test. Focus on wrong
              and marked-for-review questions before starting a new paper.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconReportSearch className="size-4" /> Deep Review Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each submitted exam includes a full review page with your selected
              option, correct option, and explanation for every question.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

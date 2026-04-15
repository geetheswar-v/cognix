"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { IconArrowRight, IconRefresh, IconReportSearch } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchLatestReviewAttempts, type ReviewAttempt } from "@/lib/tests-api"

export function ReviewList() {
  const [isLoading, setIsLoading] = useState(true)
  const [attempts, setAttempts] = useState<ReviewAttempt[]>([])

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchLatestReviewAttempts(40)
        setAttempts(payload)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Review center
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Detailed Exam Reviews
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open any submitted exam to inspect selected answers, correct options,
          and full explanations.
        </p>
      </section>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>No submitted attempts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete and submit an exam to unlock detailed review.
            </p>
            <Button className="mt-4" variant="outline" render={<Link href="/exams" />}>
              Browse Exams
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attempts.map((attempt) => (
            <Card key={attempt.attemptId} className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">
                  {attempt.examType === "full" ? "Full Test" : "Chapter Test"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {attempt.subject ? `${attempt.subject} · ` : ""}
                  {attempt.chapter ?? "General"}
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Score: {attempt.score}</p>
                  <p>Correct: {attempt.correctCount}</p>
                  <p>Wrong: {attempt.wrongCount}</p>
                  <p>Unattempted: {attempt.unattemptedCount}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    render={<Link href={`/review/${attempt.examId}`} />}
                  >
                    <IconReportSearch className="size-4" /> Open review
                    <IconArrowRight className="size-4" />
                  </Button>
                  <Button render={<Link href={`/exam/${attempt.examId}`} />}>
                    <IconRefresh className="size-4" /> Reattempt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IconChecklist, IconRosetteDiscountCheckFilled } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchExamReviewByExamId, type ExamReview } from "@/lib/tests-api"

type ExamSubmittedProps = {
  examId: string
}

export function ExamSubmitted({ examId }: ExamSubmittedProps) {
  const [review, setReview] = useState<ExamReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchExamReviewByExamId(examId)
        setReview(payload)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [examId])

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <Skeleton className="h-64 w-full max-w-2xl rounded-3xl" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <Card className="w-full max-w-xl border-border/70">
          <CardHeader>
            <CardTitle>Submission completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your paper has been submitted. You can open review once analysis is ready.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" render={<Link href={`/exam/${examId}`} />}>
                Reattempt exam
              </Button>
              <Button variant="outline" render={<Link href="/" />}>
                Go dashboard
              </Button>
              <Button render={<Link href={`/review/${examId}`} />}>Open review</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--chart-2)_20%,transparent),transparent_35%),radial-gradient(circle_at_80%_70%,color-mix(in_oklch,var(--primary)_15%,transparent),transparent_40%),var(--background)] p-6">
      <Card className="w-full max-w-2xl border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <IconRosetteDiscountCheckFilled className="size-6 text-primary" />
            Exam Submitted Successfully
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Total Score</p>
              <p className="mt-1 text-2xl font-semibold">{review.attempt.score}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Question Count</p>
              <p className="mt-1 text-2xl font-semibold">{review.exam.totalQuestions}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Correct</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {review.attempt.correctCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Wrong</p>
              <p className="mt-1 text-2xl font-semibold text-rose-600">
                {review.attempt.wrongCount}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <IconChecklist className="size-4" /> Next step
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the detailed review to see your selected options, correct options,
              and explanations for every question.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button render={<Link href={`/review/${examId}`} />}>Open detailed review</Button>
            <Button variant="outline" render={<Link href={`/exam/${examId}`} />}>
              Reattempt exam
            </Button>
            <Button variant="outline" render={<Link href="/" />}>
              Back to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

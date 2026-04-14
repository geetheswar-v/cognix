"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconMinus,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchExamReviewByExamId, type ExamReview } from "@/lib/tests-api"
import { cn } from "@/lib/utils"

type ExamReviewProps = {
  examId: string
}

export function ExamReviewView({ examId }: ExamReviewProps) {
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
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }

  if (!review) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Review not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Submit this exam first, then the detailed review will be available.
          </p>
          <Button className="mt-4" variant="outline" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Exam Review
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {review.exam.chapter ?? "Exam performance summary"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.exam.subject ?? "General"} · {review.exam.totalQuestions} questions
            </p>
          </div>
          <Button variant="outline" render={<Link href="/" />}>
            Back dashboard
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-semibold">{review.attempt.score}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-xs text-muted-foreground">Correct</p>
            <p className="text-2xl font-semibold text-emerald-700">
              {review.attempt.correctCount}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="text-xs text-muted-foreground">Wrong</p>
            <p className="text-2xl font-semibold text-rose-700">
              {review.attempt.wrongCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Unattempted</p>
            <p className="text-2xl font-semibold">{review.attempt.unattemptedCount}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {review.questions.map((question) => (
          <Card key={question.id} className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">
                Q{question.questionNumber}. {question.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = option.id === question.selectedOptionId
                  const isCorrect = option.id === question.correctOptionId
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-sm",
                        isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : isSelected
                            ? "border-rose-500/40 bg-rose-500/10"
                            : "border-border bg-background"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <IconCircleCheck className="size-4 text-emerald-600" />
                        ) : isSelected ? (
                          <IconCircleX className="size-4 text-rose-600" />
                        ) : (
                          <IconMinus className="size-4 text-muted-foreground" />
                        )}
                        <span>{option.optionText}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <IconEye className="size-4" /> Explanation
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {question.explanation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

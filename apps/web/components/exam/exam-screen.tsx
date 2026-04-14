"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconArrowRight,
  IconClockHour4,
  IconBookmark,
  IconChecklist,
} from "@tabler/icons-react"

import { useExamSession, type ExamQuestionStatus } from "@/hooks/use-exam-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type ExamScreenProps = {
  examId: string
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
}

function statusClasses(status: ExamQuestionStatus, isCurrent: boolean) {
  if (isCurrent) return "border-primary bg-primary text-primary-foreground"
  switch (status) {
    case "answered":
      return "border-emerald-500/40 bg-emerald-500/10"
    case "unanswered":
      return "border-border bg-background hover:border-primary/40"
    case "marked-answered":
      return "border-amber-500/60 bg-amber-500/15"
    case "marked-unanswered":
      return "border-rose-500/50 bg-rose-500/12"
    default:
      return "border-border bg-background"
  }
}

function ExamSkeleton() {
  return (
    <div className="grid min-h-svh gap-4 p-4 lg:grid-cols-[1fr_340px] lg:p-6">
      <Skeleton className="h-[85vh] rounded-3xl" />
      <Skeleton className="h-[85vh] rounded-3xl" />
    </div>
  )
}

export function ExamScreen({ examId }: ExamScreenProps) {
  const router = useRouter()
  const {
    exam,
    questions,
    attempts,
    statusByQuestionId,
    counts,
    isLoading,
    isSubmitting,
    selectAnswer,
    clearAnswer,
    toggleMarkForReview,
    submit,
  } = useExamSession(examId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const currentQuestion = questions[currentIndex] ?? null
  const totalQuestions = exam?.totalQuestions ?? questions.length

  const answeredTotal = useMemo(
    () => counts.answered + counts["marked-answered"],
    [counts]
  )

  const progress = useMemo(() => {
    if (!totalQuestions) return 0
    return Math.round((answeredTotal / totalQuestions) * 100)
  }, [answeredTotal, totalQuestions])

  if (isLoading) return <ExamSkeleton />

  if (!exam || !currentQuestion) {
    return (
      <main className="grid min-h-svh place-items-center p-6">
        <Card className="w-full max-w-xl border-border/70">
          <CardHeader>
            <CardTitle>Exam could not be loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This exam may not exist yet or is unavailable right now.
            </p>
            <Button className="mt-4" variant="outline" render={<Link href="/" />}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklch,var(--chart-2)_14%,transparent),transparent_35%),radial-gradient(circle_at_80%_85%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_44%),var(--background)] p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur sm:p-6">
          <header className="mb-5 border-b border-border/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {exam.examType === "full" ? "Full exam" : "Chapter exam"}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {exam.chapter ?? "NEET Practice Exam"}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {exam.subject ?? "General"} · {totalQuestions} Questions
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/75 px-4 py-2">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <IconClockHour4 className="size-4" /> Elapsed Time
                </p>
                <p className="mt-1 font-mono text-lg font-semibold">
                  {formatDuration(elapsedSeconds)}
                </p>
              </div>
            </div>
          </header>

          <article>
            <p className="text-sm font-semibold text-muted-foreground">
              Question {currentQuestion.questionNumber}
            </p>
            <h2 className="mt-2 text-lg leading-relaxed font-medium">
              {currentQuestion.questionText}
            </h2>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected =
                  attempts[currentQuestion.id]?.selectedOptionId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAnswer(currentQuestion.id, option.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/80 hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className="grid size-5 place-items-center rounded-full border border-border text-xs">
                        {String.fromCharCode(65 + option.optionIndex)}
                      </span>
                      {option.optionText}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => clearAnswer(currentQuestion.id)}
                >
                  Clear response
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                >
                  <IconBookmark className="size-4" />
                  {attempts[currentQuestion.id]?.markedForReview
                    ? "Unmark review"
                    : "Mark for review"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                >
                  <IconArrowLeft className="size-4" /> Previous
                </Button>
                <Button
                  disabled={currentIndex >= questions.length - 1}
                  onClick={() =>
                    setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))
                  }
                >
                  Next <IconArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconChecklist className="size-4 text-primary" /> Submission Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-full bg-muted p-1">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <p>Answered: {counts.answered}</p>
                <p>Unanswered: {counts.unanswered}</p>
                <p>Mark for review (answered): {counts["marked-answered"]}</p>
                <p>Mark for review (unanswered): {counts["marked-unanswered"]}</p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger render={<Button className="mt-4 w-full" />}>
                  Submit Exam
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can review detailed results on the next screen, including
                      correct/wrong analysis and explanations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isSubmitting}
                      onClick={() => {
                        void submit().then(() => {
                          router.push(`/exam/${exam.id}/submitted`)
                        })
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Confirm Submission"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                className="mt-3 w-full"
                variant="outline"
                render={<Link href="/" />}
              >
                Exit to dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const status = statusByQuestionId[question.id] ?? "unanswered"
                  const isCurrent = index === currentIndex
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-9 rounded-lg border text-xs font-semibold transition-colors",
                        statusClasses(status, isCurrent)
                      )}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}

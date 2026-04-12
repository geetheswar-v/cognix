"use client"

import { useEffect, useMemo, useState } from "react"
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconChecklist,
  IconClock,
  IconFlag2,
  IconSend2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExamDetailsResponse, ExamQuestion, ExamSubmitResponse } from "@/components/main/types"

type ExamTakingClientProps = {
  exam: NonNullable<ExamDetailsResponse["exam"]>
  questions: ExamQuestion[]
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export function ExamTakingClient({ exam, questions }: ExamTakingClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<string[]>([])
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamSubmitResponse["result"] | null>(null)
  const [timeLeft, setTimeLeft] = useState(() => Math.max(questions.length * 60, 15 * 60))

  useEffect(() => {
    if (result) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowSubmitPrompt(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [result])

  const currentQuestion = questions[currentIndex]
  const attemptedCount = Object.keys(selectedByQuestion).length
  const unattemptedCount = questions.length - attemptedCount
  const reviewCount = markedForReview.length

  const canPrev = currentIndex > 0
  const canNext = currentIndex < questions.length - 1

  const paletteStatus = useMemo(() => {
    const marked = new Set(markedForReview)
    return questions.map((question) => ({
      id: question.id,
      isMarked: marked.has(question.id),
      isAnswered: Boolean(selectedByQuestion[question.id]),
    }))
  }, [markedForReview, questions, selectedByQuestion])

  async function submitExam() {
    setIsSubmitting(true)
    setSubmitError(null)

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: selectedByQuestion[question.id] ?? null,
    }))

    const response = await fetch(`/api/tests/${exam.id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    })

    const data = (await response.json()) as ExamSubmitResponse

    if (!response.ok || !data.success || !data.result) {
      setSubmitError(data.error ?? "Failed to submit exam")
      setIsSubmitting(false)
      return
    }

    setResult(data.result)
    setIsSubmitting(false)
    setShowSubmitPrompt(false)
  }

  if (result) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card className="rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Test submitted successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground">
              Attempt ID: <span className="font-mono text-xs">{result.attemptId}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-200/80 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-muted-foreground uppercase">Score</p>
                <p className="mt-1 text-2xl font-semibold">{result.score}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100/80 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <p className="text-xs uppercase">Correct</p>
                <p className="mt-1 text-2xl font-semibold">{result.correctCount}</p>
              </div>
              <div className="rounded-2xl bg-rose-100/80 p-4 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <p className="text-xs uppercase">Wrong</p>
                <p className="mt-1 text-2xl font-semibold">{result.wrongCount}</p>
              </div>
              <div className="rounded-2xl bg-amber-100/80 p-4 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="text-xs uppercase">Unattempted</p>
                <p className="mt-1 text-2xl font-semibold">{result.unattemptedCount}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              You answered {result.correctCount + result.wrongCount} out of {result.totalQuestions} questions.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[1fr_300px]">
      <Card className="rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold tracking-tight">
              {exam.examType === "full" ? "Full Test" : `${exam.subject} · ${exam.chapter}`}
            </CardTitle>
            <div className="inline-flex items-center gap-2 rounded-xl bg-background px-3 py-1.5 text-sm font-medium">
              <IconClock className="size-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="flex gap-2 text-xs">
              <span className="rounded-md bg-emerald-100/80 px-2 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">+{exam.scoring.correct}</span>
              <span className="rounded-md bg-rose-100/80 px-2 py-1 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{exam.scoring.wrong}</span>
              <span className="rounded-md bg-slate-200/80 px-2 py-1 text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">{exam.scoring.unattempted}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base leading-relaxed font-medium text-foreground">{currentQuestion?.questionText}</h3>
            <div className="space-y-2">
              {currentQuestion?.options.map((option) => {
                const selectedId = selectedByQuestion[currentQuestion.id]
                const isSelected = selectedId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedByQuestion((prev) => ({
                        ...prev,
                        [currentQuestion.id]: option.id,
                      }))
                    }}
                    className={
                      isSelected
                        ? "w-full rounded-2xl border border-primary/50 bg-primary/10 px-4 py-3 text-left text-sm"
                        : "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-left text-sm hover:border-primary/40"
                    }
                  >
                    <span className="font-medium">{String.fromCharCode(65 + option.optionIndex)}.</span>{" "}
                    {option.optionText}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setMarkedForReview((prev) => {
                    if (prev.includes(currentQuestion.id)) {
                      return prev.filter((id) => id !== currentQuestion.id)
                    }
                    return [...prev, currentQuestion.id]
                  })
                }}
              >
                <IconFlag2 />
                {markedForReview.includes(currentQuestion.id)
                  ? "Marked for Review"
                  : "Mark for Review"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-2xl"
                onClick={() => {
                  setSelectedByQuestion((prev) => {
                    const next = { ...prev }
                    delete next[currentQuestion.id]
                    return next
                  })
                }}
              >
                Clear Response
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={!canPrev}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
              >
                <IconArrowLeft /> Prev
              </Button>
              <Button
                className="rounded-2xl"
                disabled={!canNext}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                Next <IconArrowRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconChecklist className="size-4 text-primary" />
            Question Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-6">
          <div className="grid grid-cols-5 gap-2">
            {paletteStatus.map((item, index) => {
              const isCurrent = index === currentIndex
              const className = item.isAnswered
                ? item.isMarked
                  ? "bg-fuchsia-600 text-white"
                  : "bg-emerald-600 text-white"
                : item.isMarked
                  ? "bg-fuchsia-100 text-fuchsia-700"
                  : "bg-slate-200/80 text-slate-800 dark:bg-slate-800/70 dark:text-slate-200"

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`${className} ${isCurrent ? "ring-2 ring-primary/60" : ""} h-9 rounded-lg text-xs font-medium`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground">
            <p>Answered: {attemptedCount}</p>
            <p>Unanswered: {unattemptedCount}</p>
            <p>Marked for review: {reviewCount}</p>
          </div>

          <Button className="w-full rounded-2xl" onClick={() => setShowSubmitPrompt(true)}>
            <IconSend2 /> Submit Test
          </Button>
        </CardContent>
      </Card>

      {showSubmitPrompt ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4">
          <Card className="w-full max-w-md rounded-3xl border border-border/70 bg-card py-0 shadow-xl">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconAlertCircle className="size-5 text-primary" />
                Submit your test?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <p className="text-sm text-muted-foreground">
                Attempted {attemptedCount} / {questions.length}. Unanswered: {unattemptedCount}. Marked for review: {reviewCount}.
              </p>
              {submitError ? (
                <p className="rounded-xl bg-rose-100/80 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{submitError}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => setShowSubmitPrompt(false)}>
                  Cancel
                </Button>
                <Button className="rounded-2xl" disabled={isSubmitting} onClick={submitExam}>
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

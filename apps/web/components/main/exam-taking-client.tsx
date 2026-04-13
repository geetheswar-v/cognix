"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconChecklist,
  IconClock,
  IconFlag2,
  IconPlayerPause,
  IconProgress,
  IconSend2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ExamDetailsResponse,
  ExamQuestion,
  ExamSubmitResponse,
} from "@/components/main/types"
import { cn } from "@/lib/utils"

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
  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string>
  >({})
  const [markedByQuestion, setMarkedByQuestion] = useState<
    Record<string, true>
  >({})
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamSubmitResponse["result"] | null>(
    null
  )
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(questions.length * 60, 15 * 60)
  )

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
  const attemptedCount = useMemo(
    () => Object.keys(selectedByQuestion).length,
    [selectedByQuestion]
  )
  const reviewCount = useMemo(
    () => Object.keys(markedByQuestion).length,
    [markedByQuestion]
  )
  const unattemptedCount = questions.length - attemptedCount

  const canPrev = currentIndex > 0
  const canNext = currentIndex < questions.length - 1

  const isCurrentMarked = currentQuestion
    ? Boolean(markedByQuestion[currentQuestion.id])
    : false

  const paletteStatus = useMemo(() => {
    return questions.map((question) => ({
      id: question.id,
      isMarked: Boolean(markedByQuestion[question.id]),
      isAnswered: Boolean(selectedByQuestion[question.id]),
    }))
  }, [markedByQuestion, questions, selectedByQuestion])

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setSelectedByQuestion((prev) => ({
        ...prev,
        [questionId]: optionId,
      }))
    },
    []
  )

  const handleToggleMarkForReview = useCallback((questionId: string) => {
    setMarkedByQuestion((prev) => {
      if (prev[questionId]) {
        const next = { ...prev }
        delete next[questionId]
        return next
      }

      return {
        ...prev,
        [questionId]: true,
      }
    })
  }, [])

  const handleClearResponse = useCallback((questionId: string) => {
    setSelectedByQuestion((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }, [])

  async function submitExam() {
    setIsSubmitting(true)
    setSubmitError(null)

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: selectedByQuestion[question.id] ?? null,
    }))

    try {
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
      setShowSubmitPrompt(false)
    } catch {
      setSubmitError("Network error while submitting exam")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Test submitted successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-6">
            <p className="text-sm text-muted-foreground">
              Attempt ID:{" "}
              <span className="font-mono text-xs">{result.attemptId}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground uppercase">Score</p>
                <p className="mt-1 text-2xl font-semibold">{result.score}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase">Correct</p>
                <p className="mt-1 text-2xl font-semibold">
                  {result.correctCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase">Wrong</p>
                <p className="mt-1 text-2xl font-semibold">
                  {result.wrongCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase">Unattempted</p>
                <p className="mt-1 text-2xl font-semibold">
                  {result.unattemptedCount}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              You answered {result.correctCount + result.wrongCount} out of{" "}
              {result.totalQuestions} questions.
            </div>
            <div className="flex justify-center pt-4">
              <Button
                render={<Link href="/" />}
                size="lg"
                className="rounded-2xl px-8"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold tracking-tight">
              {exam.examType === "full"
                ? "Full Test"
                : `${exam.subject} · ${exam.chapter}`}
            </CardTitle>
            <div className="inline-flex items-center gap-2 rounded-xl bg-background px-3 py-1.5 text-sm font-medium">
              <IconClock />
              {formatTime(timeLeft)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted px-2 py-1">
                +{exam.scoring.correct} correct
              </span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">
                {exam.scoring.wrong} wrong
              </span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">
                {exam.scoring.unattempted} unattempted
              </span>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border bg-muted px-2 py-1">
              <IconProgress className="mr-1 inline" />
              Progress {currentIndex + 1}/{questions.length}
            </span>
            <span className="rounded-md border border-border bg-muted px-2 py-1">
              <IconPlayerPause className="mr-1 inline" />
              You can submit anytime
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-base leading-relaxed font-medium text-foreground">
              {currentQuestion?.questionText}
            </h3>
            <div className="flex flex-col gap-2">
              {currentQuestion?.options.map((option) => {
                const selectedId = selectedByQuestion[currentQuestion.id]
                const isSelected = selectedId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      handleSelectOption(currentQuestion.id, option.id)
                    }
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                      isSelected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background hover:border-primary/35 hover:bg-muted/40"
                    )}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + option.optionIndex)}.
                    </span>{" "}
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
                onClick={() => handleToggleMarkForReview(currentQuestion.id)}
              >
                <IconFlag2 />
                {isCurrentMarked ? "Marked for Review" : "Mark for Review"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-2xl"
                onClick={() => handleClearResponse(currentQuestion.id)}
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

      <Card className="h-fit rounded-3xl border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconChecklist className="text-primary" />
            Question Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="grid grid-cols-5 gap-2">
            {paletteStatus.map((item, index) => {
              const isCurrent = index === currentIndex
              const className = item.isAnswered
                ? item.isMarked
                  ? "border-primary bg-primary/20 text-foreground"
                  : "border-primary bg-primary text-primary-foreground"
                : item.isMarked
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-muted text-muted-foreground"

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-medium transition-colors",
                    className,
                    isCurrent && "ring-2 ring-primary/50"
                  )}
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

          <Button
            className="w-full rounded-2xl"
            onClick={() => setShowSubmitPrompt(true)}
          >
            <IconSend2 /> Submit Test
          </Button>
        </CardContent>
      </Card>

      {showSubmitPrompt ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4">
          <Card className="w-full max-w-md rounded-3xl border border-border/70 bg-card shadow-xl">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconAlertCircle className="text-primary" />
                Submit your test?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 py-6">
              <p className="text-sm text-muted-foreground">
                Attempted {attemptedCount} / {questions.length}. Unanswered:{" "}
                {unattemptedCount}. Marked for review: {reviewCount}.
              </p>
              {submitError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setShowSubmitPrompt(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-2xl"
                  disabled={isSubmitting}
                  onClick={submitExam}
                >
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

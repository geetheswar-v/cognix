"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconArrowRight, IconClockHour4 } from "@tabler/icons-react"

import { useExamSession, type ExamQuestionStatus } from "@/hooks/use-exam-session"
import { Button } from "@/components/ui/button"
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

type QuestionSection = {
  key: string
  label: string
  questionIndexes: number[]
}

type LegendStatus =
  | "answered"
  | "unanswered"
  | "not-visited"
  | "marked-unanswered"
  | "marked-answered"

const DEFAULT_EXAM_DURATION_SECONDS = 3 * 60 * 60
const SUBJECT_ORDER = ["physics", "chemistry", "botany", "zoology"] as const
type KnownSubject = (typeof SUBJECT_ORDER)[number]

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
}

function normalizeSectionKey(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? ""
  return normalized || "general"
}

function formatSectionLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ")
}

function navigatorStatusClasses(
  status: ExamQuestionStatus,
  isCurrent: boolean,
  isVisited: boolean
) {
  const currentClasses = isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-[#d2e4f5]" : ""

  if (!isVisited) {
    return cn("border-slate-300 bg-white text-slate-700", currentClasses)
  }

  switch (status) {
    case "answered":
      return cn(
        "border-emerald-600 bg-emerald-500 text-white [clip-path:polygon(0_0,100%_0,100%_78%,80%_100%,0_100%)]",
        currentClasses
      )
    case "unanswered":
      return cn(
        "border-rose-600 bg-rose-500 text-white [clip-path:polygon(0_0,78%_0,100%_24%,100%_100%,0_100%)]",
        currentClasses
      )
    case "marked-unanswered":
      return cn("rounded-full border-violet-600 bg-violet-500 text-white", currentClasses)
    case "marked-answered":
      return cn("rounded-full border-violet-600 bg-violet-500 text-white", currentClasses)
    default:
      return cn("border-slate-300 bg-white text-slate-700", currentClasses)
  }
}

function LegendSwatch({ status }: { status: LegendStatus }) {
  const baseClasses = "relative inline-block size-4 border"

  if (status === "not-visited") {
    return <span className={cn(baseClasses, "rounded-sm border-slate-300 bg-white")} />
  }

  if (status === "answered") {
    return (
      <span
        className={cn(
          baseClasses,
          "border-emerald-600 bg-emerald-500 [clip-path:polygon(0_0,100%_0,100%_78%,80%_100%,0_100%)]"
        )}
      />
    )
  }

  if (status === "unanswered") {
    return (
      <span
        className={cn(
          baseClasses,
          "border-rose-600 bg-rose-500 [clip-path:polygon(0_0,78%_0,100%_24%,100%_100%,0_100%)]"
        )}
      />
    )
  }

  if (status === "marked-unanswered") {
    return <span className={cn(baseClasses, "rounded-full border-violet-600 bg-violet-500")} />
  }

  return (
    <span className={cn(baseClasses, "rounded-full border-violet-600 bg-violet-500")}>
      <span className="absolute -top-1 -right-1 size-2.5 rounded-full border border-white bg-emerald-500" />
    </span>
  )
}

function ExamSkeleton() {
  return (
    <div className="grid min-h-svh gap-3 p-3 xl:grid-cols-[1fr_350px] xl:p-4">
      <Skeleton className="h-[88vh] rounded-[28px]" />
      <Skeleton className="h-[88vh] rounded-[28px]" />
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
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_EXAM_DURATION_SECONDS)
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<Record<string, boolean>>({})

  const currentQuestion = questions[currentIndex] ?? null
  const totalQuestions = exam?.totalQuestions ?? questions.length

  const allQuestionIndexes = useMemo(
    () => questions.map((_, questionIndex) => questionIndex),
    [questions]
  )

  const sections = useMemo<QuestionSection[]>(() => {
    const bySection = new Map<string, number[]>()

    questions.forEach((question, questionIndex) => {
      const key = normalizeSectionKey(question.subject)
      const existing = bySection.get(key)
      if (existing) {
        existing.push(questionIndex)
      } else {
        bySection.set(key, [questionIndex])
      }
    })

    const orderedSubjects = SUBJECT_ORDER.filter((subject) => bySection.has(subject))
    const otherSubjects = Array.from(bySection.keys())
      .filter((subject) => !SUBJECT_ORDER.includes(subject as KnownSubject))
      .sort((left, right) => formatSectionLabel(left).localeCompare(formatSectionLabel(right)))

    return [...orderedSubjects, ...otherSubjects].map((key) => ({
      key,
      label: formatSectionLabel(key),
      questionIndexes: bySection.get(key) ?? [],
    }))
  }, [questions])

  const sectionByIndex = useMemo(() => {
    const map: Record<number, string> = {}
    sections.forEach((section) => {
      section.questionIndexes.forEach((questionIndex) => {
        map[questionIndex] = section.key
      })
    })
    return map
  }, [sections])

  const currentSectionKey = sectionByIndex[currentIndex] ?? sections[0]?.key ?? null
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(currentSectionKey)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!currentQuestion) return
    setVisitedQuestionIds((current) => ({
      ...current,
      [currentQuestion.id]: true,
    }))
  }, [currentQuestion])

  useEffect(() => {
    if (!currentSectionKey) return
    setActiveSectionKey((previous) => (previous === currentSectionKey ? previous : currentSectionKey))
  }, [currentSectionKey])

  const answeredTotal = useMemo(
    () => counts.answered + counts["marked-answered"],
    [counts]
  )

  const progress = useMemo(() => {
    if (!totalQuestions) return 0
    return Math.round((answeredTotal / totalQuestions) * 100)
  }, [answeredTotal, totalQuestions])

  const notVisitedCount = useMemo(
    () =>
      questions.reduce(
        (count, question) => (visitedQuestionIds[question.id] ? count : count + 1),
        0
      ),
    [questions, visitedQuestionIds]
  )

  const activeSection =
    sections.find((section) => section.key === activeSectionKey) ?? sections[0] ?? null
  const activeSectionIndexes = activeSection?.questionIndexes ?? allQuestionIndexes
  const activePosition = activeSectionIndexes.indexOf(currentIndex)
  const isFirstInSection = activePosition <= 0
  const isLastInSection =
    activePosition < 0 || activePosition >= activeSectionIndexes.length - 1

  const activeSectionNotVisited = useMemo(() => {
    return activeSectionIndexes.reduce((count, questionIndex) => {
      const question = questions[questionIndex]
      if (!question) return count
      return visitedQuestionIds[question.id] ? count : count + 1
    }, 0)
  }, [activeSectionIndexes, questions, visitedQuestionIds])

  const goToNextQuestion = () => {
    if (!activeSectionIndexes.length) return
    if (activePosition < 0) {
      setCurrentIndex(activeSectionIndexes[0]!)
      return
    }

    const nextPosition = Math.min(activeSectionIndexes.length - 1, activePosition + 1)
    setCurrentIndex(activeSectionIndexes[nextPosition]!)
  }

  const goToPreviousQuestion = () => {
    if (!activeSectionIndexes.length) return
    if (activePosition < 0) {
      setCurrentIndex(activeSectionIndexes[0]!)
      return
    }

    const previousPosition = Math.max(0, activePosition - 1)
    setCurrentIndex(activeSectionIndexes[previousPosition]!)
  }

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return
    toggleMarkForReview(currentQuestion.id)
    goToNextQuestion()
  }

  if (isLoading) return <ExamSkeleton />

  if (!exam || !currentQuestion) {
    return (
      <main className="grid min-h-svh place-items-center p-6">
        <div className="w-full max-w-xl rounded-3xl bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold">Exam could not be loaded</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This exam may not exist yet or is unavailable right now.
          </p>
          <Button className="mt-4" variant="outline" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#edf2f8] p-2 dark:bg-zinc-950 lg:p-3">
      <div className="mx-auto grid h-[calc(100svh-1rem)] max-w-[1600px] gap-2 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-background shadow-xl shadow-primary/10">
          <header className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900 px-4 py-2 text-zinc-100">
            <p className="text-sm font-semibold">
              {exam.examType === "full" ? "CBT Question Paper" : "Chapter CBT"}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
              <IconClockHour4 className="size-4" />
              Time Left:{" "}
              <span
                className={cn(
                  "font-mono",
                  remainingSeconds <= 5 * 60 && "text-rose-300"
                )}
              >
                {formatDuration(remainingSeconds)}
              </span>
            </div>
          </header>

          <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  {exam.subject ?? "General"}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {exam.chapter ?? "NEET Full Mock"}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalQuestions} Questions · +{exam.scoring.correct} / {exam.scoring.wrong}
                </p>
              </div>
              <p className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                Q.No. {currentQuestion.questionNumber}
              </p>
            </div>

            {sections.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sections.map((section) => {
                  const isActive = section.key === activeSection?.key
                  const answeredInSection = section.questionIndexes.reduce((count, questionIndex) => {
                    const question = questions[questionIndex]
                    if (!question) return count
                    const status = statusByQuestionId[question.id] ?? "unanswered"
                    return status === "answered" || status === "marked-answered"
                      ? count + 1
                      : count
                  }, 0)

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => {
                        setActiveSectionKey(section.key)
                        if (section.questionIndexes[0] !== undefined) {
                          setCurrentIndex(section.questionIndexes[0])
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {section.label}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-background text-foreground"
                        )}
                      >
                        {answeredInSection}/{section.questionIndexes.length}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <article className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                Section: {formatSectionLabel(normalizeSectionKey(currentQuestion.subject))}
              </span>
              <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                Q.Type: MCQ Single
              </span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                +{exam.scoring.correct}
              </span>
              <span className="rounded-md bg-rose-500/15 px-2 py-1 text-rose-700 dark:text-rose-300">
                -{Math.abs(exam.scoring.wrong)}
              </span>
            </div>

            <h2 className="text-lg leading-relaxed font-medium sm:text-[1.18rem]">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = attempts[currentQuestion.id]?.selectedOptionId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAnswer(currentQuestion.id, option.id)}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/35"
                        : "bg-muted/45 hover:bg-muted"
                    )}
                  >
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className="grid size-5 place-items-center rounded-full bg-background text-xs">
                        {String.fromCharCode(65 + option.optionIndex)}
                      </span>
                      {option.optionText}
                    </span>
                  </button>
                )
              })}
            </div>
          </article>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 bg-muted/35 px-4 py-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleMarkForReviewAndNext}>
                Mark for Review & Next
              </Button>
              <Button variant="outline" onClick={() => clearAnswer(currentQuestion.id)}>
                Clear Response
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={isFirstInSection}
                onClick={goToPreviousQuestion}
              >
                <IconArrowLeft className="size-4" /> Previous
              </Button>
              <Button disabled={isLastInSection} onClick={goToNextQuestion}>
                Save & Next <IconArrowRight className="size-4" />
              </Button>
            </div>
          </footer>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-[#d2e4f5] text-slate-900 shadow-xl shadow-primary/10 dark:bg-zinc-900 dark:text-zinc-100">
          <header className="flex items-center justify-between bg-[#2b3542] px-3 py-2 text-white">
            <p className="text-sm font-semibold">Question Paper</p>
            <p className="text-xs font-semibold">Candidate</p>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            <div className="rounded-2xl bg-white/75 p-3 text-xs dark:bg-zinc-800/90">
              <p className="font-semibold text-muted-foreground">Legend</p>
              <div className="mt-2 space-y-1.5">
                <p className="inline-flex items-center gap-2">
                  <LegendSwatch status="answered" /> Answered
                </p>
                <p className="inline-flex items-center gap-2">
                  <LegendSwatch status="unanswered" /> Not Answered
                </p>
                <p className="inline-flex items-center gap-2">
                  <LegendSwatch status="not-visited" /> Not Visited
                </p>
                <p className="inline-flex items-center gap-2">
                  <LegendSwatch status="marked-unanswered" /> Marked for Review
                </p>
                <p className="inline-flex items-center gap-2">
                  <LegendSwatch status="marked-answered" /> Answered & Marked for Review
                </p>
              </div>
            </div>

            <div className="rounded-full bg-white/70 p-1 dark:bg-zinc-800/90">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/75 p-3 text-xs dark:bg-zinc-800/90">
              <p>Answered: {counts.answered}</p>
              <p>Not Answered: {counts.unanswered}</p>
              <p>Review: {counts["marked-unanswered"]}</p>
              <p>Review + Ans: {counts["marked-answered"]}</p>
              <p>Not visited: {notVisitedCount}</p>
              <p>Section not visited: {activeSectionNotVisited}</p>
            </div>

            {sections.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => {
                  const isActive = section.key === activeSection?.key
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => {
                        setActiveSectionKey(section.key)
                        if (section.questionIndexes[0] !== undefined) {
                          setCurrentIndex(section.questionIndexes[0])
                        }
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/80 text-slate-700 hover:bg-white dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      {section.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="rounded-2xl bg-white/75 p-3 dark:bg-zinc-800/90">
              <p className="text-sm font-semibold">
                {activeSection?.label ?? "Questions"}
              </p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {activeSectionIndexes.map((questionIndex, sectionIndex) => {
                  const question = questions[questionIndex]
                  if (!question) return null

                  const status = statusByQuestionId[question.id] ?? "unanswered"
                  const isCurrent = questionIndex === currentIndex
                  const isVisited = Boolean(visitedQuestionIds[question.id])

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(questionIndex)}
                      className={cn(
                        "relative h-10 border text-xs font-semibold transition-transform hover:-translate-y-0.5",
                        navigatorStatusClasses(status, isCurrent, isVisited)
                      )}
                    >
                      {sectionIndex + 1}
                      {status === "marked-answered" ? (
                        <span className="absolute -top-1 -right-1 size-3 rounded-full border border-white bg-emerald-500 dark:border-zinc-900" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <footer className="space-y-2 border-t border-black/10 bg-white/40 p-3 dark:border-white/10 dark:bg-zinc-900/70">
            <AlertDialog>
              <AlertDialogTrigger render={<Button className="w-full" />}>
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

            <Button className="w-full" variant="outline" render={<Link href="/" />}>
              Exit to dashboard
            </Button>
          </footer>
        </aside>
      </div>
    </main>
  )
}

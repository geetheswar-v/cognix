import Link from "next/link"
import {
  IconBook2,
  IconArrowRight,
  IconBolt,
  IconCircleCheck,
  IconFlask2,
  IconHistory,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  AttemptedExamListResponse,
  LatestFullExamResponse,
} from "@/components/main/types"

type ExamsOverviewScreenProps = {
  latestFullExam: LatestFullExamResponse | null
  latestAttempts: AttemptedExamListResponse | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function ExamsOverviewScreen({
  latestFullExam,
  latestAttempts,
}: ExamsOverviewScreenProps) {
  const fullExam = latestFullExam?.exam
  const history = latestAttempts?.attempts ?? []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <IconBolt className="size-5 text-primary" />
            Latest Full Test
          </CardTitle>
          <CardDescription>
            Take the most recent full paper to keep momentum.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          {fullExam ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available now</p>
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    Grand Test · {fullExam.totalQuestions} Questions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created on {formatDate(fullExam.createdAt)}
                  </p>
                </div>
                <Button
                  render={<Link href="/exams/take/full" />}
                  className="rounded-2xl"
                >
                  Start Full Test
                  <IconArrowRight />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  +{fullExam.scoring.correct} for correct
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {fullExam.scoring.wrong} for wrong
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {fullExam.scoring.unattempted} for unattempted
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No completed full test is available yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <IconHistory className="size-5 text-primary" />
            Recent Attempted Tests
          </CardTitle>
          <CardDescription>
            Open any past attempt and inspect every answer with explanation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attempted tests found yet. Submit a test to see review links.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((exam) => (
                <div
                  key={exam.attemptId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium tracking-tight text-foreground">
                      {exam.examType === "full"
                        ? "Grand Test"
                        : `${exam.subject ?? "Subject"} · ${exam.chapter ?? "Chapter"}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.questions} questions · Score {exam.score} · Submitted{" "}
                      {formatDate(exam.submittedAt ?? exam.createdAt)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border border-border bg-muted px-2 py-1">
                        <IconCircleCheck className="mr-1 inline" />
                        {exam.correctCount} correct
                      </span>
                      <span className="rounded-md border border-border bg-muted px-2 py-1">
                        {exam.wrongCount} wrong
                      </span>
                      <span className="rounded-md border border-border bg-muted px-2 py-1">
                        {exam.unattemptedCount} unattempted
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      render={<Link href={`/exams/review/${exam.examId}`} />}
                      variant="outline"
                      className="rounded-2xl"
                    >
                      <IconFlask2 />
                      Review Attempt
                    </Button>
                    <Button
                      render={<Link href={exam.examType === "full" ? "/exams/take/full" : "/exams"} />}
                      variant="ghost"
                      className="rounded-2xl"
                    >
                      <IconBook2 />
                      Retry
                      <IconArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

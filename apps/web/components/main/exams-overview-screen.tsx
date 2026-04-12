import Link from "next/link"
import { IconArrowRight, IconBolt, IconFlask2, IconHistory } from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChapterExamListResponse, LatestFullExamResponse } from "@/components/main/types"
import { linkButtonOutline, linkButtonPrimary } from "@/lib/button-link-styles"
import { cn } from "@/lib/utils"

type ExamsOverviewScreenProps = {
  latestFullExam: LatestFullExamResponse | null
  latestChapterExams: ChapterExamListResponse | null
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
  latestChapterExams,
}: ExamsOverviewScreenProps) {
  const fullExam = latestFullExam?.exam
  const history = latestChapterExams?.exams ?? []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <IconBolt className="size-5 text-primary" />
            Latest Full Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-6">
          {fullExam ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available test</p>
                  <p className="text-xl font-semibold tracking-tight">
                    Grand Test · {fullExam.totalQuestions} Questions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created on {formatDate(fullExam.createdAt)}
                  </p>
                </div>
                <Link href="/exams/take/full" className={cn(linkButtonPrimary, "rounded-2xl")}>
                  Start Full Test
                  <IconArrowRight />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-100/80 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  +{fullExam.scoring.correct} marks for correct
                </div>
                <div className="rounded-2xl bg-rose-100/80 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                  {fullExam.scoring.wrong} marks for wrong
                </div>
                <div className="rounded-2xl bg-slate-200/80 p-3 text-sm text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
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

      <Card className="rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <IconHistory className="size-5 text-primary" />
            Recent Chapter Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chapter test history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((exam) => (
                <div
                  key={exam.examId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div>
                    <p className="font-medium tracking-tight text-foreground">
                      {exam.subject ?? "Subject"} · {exam.chapter ?? "Chapter"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.questions} questions · {formatDate(exam.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/exams/review/${exam.testId}`}
                    className={cn(linkButtonOutline, "rounded-2xl")}
                  >
                    <IconFlask2 />
                    Review Attempt
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

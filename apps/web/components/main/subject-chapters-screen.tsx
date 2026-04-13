import Link from "next/link"
import { IconArrowRight, IconBook2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SUBJECTS,
  type SubjectChaptersResponse,
  type SubjectId,
} from "@/components/main/types"

type SubjectChaptersScreenProps = {
  subjectId: SubjectId
  data: SubjectChaptersResponse | null
}

function formatDate(value: string | null) {
  if (!value) return "No tests yet"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function SubjectChaptersScreen({
  subjectId,
  data,
}: SubjectChaptersScreenProps) {
  const subject = SUBJECTS[subjectId]
  const chapters = data?.chapters ?? []
  const subjectClass = `subject-${subjectId}`
  const subjectBgClass = `subject-${subjectId}-bg`
  const subjectSoftBgClass = `subject-${subjectId}-soft`

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-3xl border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Subject Syllabus
        </p>
        <h2
          className={`mt-2 text-3xl font-semibold tracking-tight ${subjectClass}`}
        >
          {subject.label}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start test button is enabled only on chapters with a latest test
          created by admin.
        </p>
      </section>

      {chapters.length === 0 ? (
        <Card className="rounded-3xl border border-border/70">
          <CardContent className="py-8 text-sm text-muted-foreground">
            No chapter data available for this subject.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {chapters.map((chapter) => (
            <Card
              key={chapter.chapter}
              className="rounded-3xl border border-border/70 bg-card/95"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-3 text-lg">
                  <span className="leading-tight">{chapter.chapter}</span>
                  <IconBook2 className="size-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pb-6">
                <p className="text-sm text-muted-foreground">
                  Latest test: {formatDate(chapter.latestCreatedAt)}
                </p>
                {chapter.latestExamId ? (
                  <Button
                    render={
                      <Link href={`/exams/take/${chapter.latestExamId}`} />
                    }
                    className={`w-full rounded-2xl text-white hover:opacity-90 ${subjectBgClass}`}
                  >
                    Start Test
                    <IconArrowRight />
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="secondary"
                    className={`w-full rounded-2xl ${subjectSoftBgClass} ${subjectClass}`}
                  >
                    Start Test
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

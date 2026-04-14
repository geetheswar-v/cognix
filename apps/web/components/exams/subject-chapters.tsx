"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconAtom,
  IconClockHour4,
  IconDna2,
  IconFlask,
  IconLeaf,
  IconLock,
  IconMagnet,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSubjectChapters, type SubjectChapter } from "@/lib/tests-api"

type SubjectChaptersProps = {
  subject: "physics" | "chemistry" | "botany" | "zoology"
}

const subjectMeta = {
  physics: {
    icon: IconMagnet,
    accent: "text-blue-600",
    soft: "bg-blue-500/10 border-blue-500/20",
  },
  chemistry: {
    icon: IconAtom,
    accent: "text-amber-600",
    soft: "bg-amber-500/10 border-amber-500/20",
  },
  botany: {
    icon: IconLeaf,
    accent: "text-emerald-600",
    soft: "bg-emerald-500/10 border-emerald-500/20",
  },
  zoology: {
    icon: IconDna2,
    accent: "text-violet-600",
    soft: "bg-violet-500/10 border-violet-500/20",
  },
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function SubjectChapters({ subject }: SubjectChaptersProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [chapters, setChapters] = useState<SubjectChapter[]>([])
  const meta = subjectMeta[subject]

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchSubjectChapters(subject)
        setChapters(payload)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [subject])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Subject track
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight capitalize">
            {subject} Chapters
          </h1>
          <div className={`rounded-2xl border p-2 ${meta.soft}`}>
            <meta.icon className={`size-6 ${meta.accent}`} />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Start available chapter tests instantly. Locked chapters indicate that
          the latest test has not been generated yet.
        </p>
      </section>

      <section>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chapters.map((chapter) => (
              <Card
                key={chapter.chapter}
                className="border-border/70 bg-card/90 transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-relaxed">
                      {chapter.chapter}
                    </CardTitle>
                    <div className={`rounded-xl border p-2 ${meta.soft}`}>
                      <meta.icon className={`size-4 ${meta.accent}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                        chapter.hasLatestTest
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-700"
                      }`}
                    >
                      {chapter.hasLatestTest ? "Test available" : "Test unavailable"}
                    </span>
                    {!chapter.hasLatestTest ? (
                      <IconLock className="size-4 text-muted-foreground" />
                    ) : null}
                  </div>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <IconClockHour4 className="size-3" />
                    {chapter.latestCreatedAt
                      ? `Latest: ${formatDate(chapter.latestCreatedAt)}`
                      : "No test generated yet"}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    disabled={!chapter.hasLatestTest || !chapter.latestExamId}
                    render={
                      chapter.hasLatestTest && chapter.latestExamId ? (
                        <Link href={`/exam/${chapter.latestExamId}`} />
                      ) : undefined
                    }
                  >
                    {chapter.hasLatestTest ? "Start test" : "Test unavailable"}
                    <IconArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

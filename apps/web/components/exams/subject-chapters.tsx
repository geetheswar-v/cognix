"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconAtom,
  IconClockHour4,
  IconDna2,
  IconLeaf,
  IconLock,
  IconMagnet,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { fetchSubjectChapters, type SubjectChapter } from "@/lib/tests-api"

type SubjectChaptersProps = {
  subject: "physics" | "chemistry" | "botany" | "zoology"
}

const subjectMeta = {
  physics: {
    icon: IconMagnet,
    accentText: "text-blue-700 dark:text-blue-300",
    soft: "bg-blue-500/7 border-blue-500/20 dark:bg-blue-400/8 dark:border-blue-400/28",
    heroGlow:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.24),transparent_45%)]",
    button:
      "border-blue-500/30 bg-blue-600 text-white hover:bg-blue-500 dark:border-blue-300/30 dark:bg-blue-500 dark:hover:bg-blue-400",
    ring: "ring-blue-500/20 dark:ring-blue-300/25",
    watermark: "text-blue-500/45 dark:text-blue-300/40",
  },
  chemistry: {
    icon: IconAtom,
    accentText: "text-amber-700 dark:text-amber-300",
    soft: "bg-amber-500/7 border-amber-500/20 dark:bg-amber-400/8 dark:border-amber-300/28",
    heroGlow:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.24),transparent_45%)]",
    button:
      "border-amber-500/30 bg-amber-600 text-white hover:bg-amber-500 dark:border-amber-300/30 dark:bg-amber-500 dark:hover:bg-amber-400",
    ring: "ring-amber-500/20 dark:ring-amber-300/25",
    watermark: "text-amber-500/45 dark:text-amber-300/40",
  },
  botany: {
    icon: IconLeaf,
    accentText: "text-emerald-700 dark:text-emerald-300",
    soft:
      "bg-emerald-500/7 border-emerald-500/20 dark:bg-emerald-400/8 dark:border-emerald-300/28",
    heroGlow:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.24),transparent_45%)]",
    button:
      "border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-500 dark:border-emerald-300/30 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    ring: "ring-emerald-500/20 dark:ring-emerald-300/25",
    watermark: "text-emerald-500/45 dark:text-emerald-300/40",
  },
  zoology: {
    icon: IconDna2,
    accentText: "text-violet-700 dark:text-violet-300",
    soft: "bg-violet-500/7 border-violet-500/20 dark:bg-violet-400/8 dark:border-violet-300/28",
    heroGlow:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.24),transparent_45%)]",
    button:
      "border-violet-500/30 bg-violet-600 text-white hover:bg-violet-500 dark:border-violet-300/30 dark:bg-violet-500 dark:hover:bg-violet-400",
    ring: "ring-violet-500/20 dark:ring-violet-300/25",
    watermark: "text-violet-500/45 dark:text-violet-300/40",
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
      <section
        className={cn(
          "relative rounded-3xl border border-border/70 bg-card p-6 overflow-hidden",
          meta.heroGlow
        )}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Subject track
        </p>
        <div className="mt-2 flex items-center justify-between gap-3 pr-20 sm:pr-28">
          <h1 className="text-3xl font-semibold tracking-tight capitalize sm:text-4xl">
            {subject} chapters
          </h1>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-12">
          <meta.icon className={cn("size-36 sm:size-44", meta.watermark)} stroke={1.25} />
          
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {chapters.map((chapter) => (
              <article
                key={chapter.chapter}
                className={cn(
                  "relative rounded-3xl border bg-card/95 p-5 ring-1",
                  meta.soft,
                  meta.ring
                )}
              >
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={cn("text-lg leading-snug font-semibold", meta.accentText)}>
                      {chapter.chapter}
                    </h3>
                  </div>

                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <IconClockHour4 className="size-3" />
                    {chapter.latestCreatedAt
                      ? `Latest update: ${formatDate(chapter.latestCreatedAt)}`
                      : "No generated test yet"}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    {!chapter.hasLatestTest ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <IconLock className="size-3.5" /> Locked
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ready to start now
                      </span>
                    )}

                    <Button
                      disabled={!chapter.hasLatestTest || !chapter.latestExamId}
                      className={cn("h-9 px-4", meta.button)}
                      render={
                        chapter.hasLatestTest && chapter.latestExamId ? (
                          <Link href={`/exam/${chapter.latestExamId}`} />
                        ) : undefined
                      }
                    >
                      {chapter.hasLatestTest ? "Start test" : "Unavailable"}
                      <IconArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

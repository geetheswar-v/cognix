"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  fetchSubjectChapters,
  requestChapterExam,
  type SubjectChapter,
} from "@/lib/tests-api"

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
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [chapters, setChapters] = useState<SubjectChapter[]>([])
  const [loadingChapter, setLoadingChapter] = useState<string | null>(null)
  const meta = subjectMeta[subject]

  const loadChapters = useCallback(async () => {
    const payload = await fetchSubjectChapters(subject)
    setChapters(payload)
  }, [subject])

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const payload = await fetchSubjectChapters(subject)
        if (active) {
          setChapters(payload)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [subject])

  const handleRequestChapterExam = useCallback(
    async (chapterName: string) => {
      setLoadingChapter(chapterName)
      try {
        const request = await requestChapterExam(subject, chapterName)
        if (request.status === "ready" && request.examId) {
          router.push(`/exam/${request.examId}`)
          return
        }

        toast({
          kind: "info",
          title: "Generation started",
          description: `We're generating a fresh ${subject} exam for ${chapterName}.`,
        })
        await loadChapters()
      } catch (error) {
        toast({
          kind: "error",
          title: "Unable to prepare exam",
          description: error instanceof Error ? error.message : "Please try again.",
        })
      } finally {
        setLoadingChapter((current) => (current === chapterName ? null : current))
      }
    },
    [loadChapters, router, subject, toast]
  )

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
          Start chapter tests instantly. If a chapter has no ready test yet, generate one in a
          single click.
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
                        <IconLock className="size-3.5" /> Not generated yet
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ready to start now
                      </span>
                    )}

                    <Button
                      disabled={loadingChapter === chapter.chapter}
                      className={cn("h-9 px-4", meta.button)}
                      onClick={() => {
                        void handleRequestChapterExam(chapter.chapter)
                      }}
                    >
                      {loadingChapter === chapter.chapter
                        ? "Preparing..."
                        : chapter.hasLatestTest
                          ? "Start test"
                          : "Generate exam"}
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

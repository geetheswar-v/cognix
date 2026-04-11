import { ExamsOverviewScreen } from "@/components/main/exams-overview-screen"
import type { ChapterExamListResponse, LatestFullExamResponse } from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchLatestFullExam() {
  const response = await apiFetch("/api/tests/latest-full-neet")

  if (!response.ok) return null
  return (await response.json()) as LatestFullExamResponse
}

async function fetchLatestChapterExams() {
  const response = await apiFetch("/api/tests/chapters/latest?limit=20")

  if (!response.ok) return null
  return (await response.json()) as ChapterExamListResponse
}

export default async function ExamsPage() {
  const [latestFullExam, latestChapterExams] = await Promise.all([
    fetchLatestFullExam(),
    fetchLatestChapterExams(),
  ])

  return (
    <ExamsOverviewScreen
      latestFullExam={latestFullExam}
      latestChapterExams={latestChapterExams}
    />
  )
}

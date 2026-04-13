import { ExamsOverviewScreen } from "@/components/main/exams-overview-screen"
import type {
  AttemptedExamListResponse,
  LatestFullExamResponse,
} from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchLatestFullExam() {
  const response = await apiFetch("/api/tests/latest-full-neet")

  if (!response.ok) return null
  return (await response.json()) as LatestFullExamResponse
}

async function fetchLatestAttempts() {
  const response = await apiFetch("/api/tests/attempts/latest?limit=20")

  if (!response.ok) return null
  return (await response.json()) as AttemptedExamListResponse
}

export default async function ExamsPage() {
  const [latestFullExam, latestAttempts] = await Promise.all([
    fetchLatestFullExam(),
    fetchLatestAttempts(),
  ])

  return (
    <ExamsOverviewScreen
      latestFullExam={latestFullExam}
      latestAttempts={latestAttempts}
    />
  )
}

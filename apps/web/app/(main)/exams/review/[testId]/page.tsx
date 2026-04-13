import { notFound } from "next/navigation"

import { ExamReviewScreen } from "@/components/main/exam-review-screen"
import type { ChapterReviewResponse } from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchReview(examId: string) {
  const response = await apiFetch(`/api/tests/exams/${examId}/review`)
  if (!response.ok) return null
  return (await response.json()) as ChapterReviewResponse
}

export default async function ReviewTestPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const data = await fetchReview(testId)

  if (!data?.success || !data.exam || !data.questions) {
    notFound()
  }

  const title =
    data.exam.examType === "full"
      ? "Grand Test Review"
      : `${data.exam.subject ?? "Subject"} · ${data.exam.chapter ?? "Chapter"} Review`

  return <ExamReviewScreen title={title} questions={data.questions} />
}

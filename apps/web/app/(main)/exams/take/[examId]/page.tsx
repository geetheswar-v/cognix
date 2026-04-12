import { notFound } from "next/navigation"

import { ExamTakingClient } from "@/components/main/exam-taking-client"
import type { ExamDetailsResponse } from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchExam(examId: string) {
  const response = await apiFetch(`/api/tests/exams/${examId}`)
  if (!response.ok) return null
  return (await response.json()) as ExamDetailsResponse
}

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const data = await fetchExam(examId)

  if (!data?.success || !data.exam || !data.questions?.length) {
    notFound()
  }

  return <ExamTakingClient exam={data.exam} questions={data.questions} />
}

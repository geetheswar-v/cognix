import { redirect } from "next/navigation"

import type { LatestFullExamResponse } from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchLatestFullExam() {
  const response = await apiFetch("/api/tests/latest-full-neet")
  if (!response.ok) return null
  return (await response.json()) as LatestFullExamResponse
}

export default async function TakeLatestFullPage() {
  const latest = await fetchLatestFullExam()
  if (!latest?.success || !latest.exam?.id) {
    redirect("/exams")
  }

  redirect(`/exams/take/${latest.exam.id}`)
}

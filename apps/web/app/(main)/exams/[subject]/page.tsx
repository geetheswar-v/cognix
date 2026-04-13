import { notFound } from "next/navigation"

import { SubjectChaptersScreen } from "@/components/main/subject-chapters-screen"
import {
  SUBJECT_IDS,
  isSubjectId,
  type SubjectChaptersResponse,
} from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

export function generateStaticParams() {
  return SUBJECT_IDS.map((subject) => ({ subject }))
}

async function fetchData(subject: string) {
  const response = await apiFetch(`/api/tests/subjects/${subject}/chapters`)
  if (!response.ok) return null
  return (await response.json()) as SubjectChaptersResponse
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject } = await params

  if (!isSubjectId(subject)) {
    notFound()
  }

  const data = await fetchData(subject)
  return <SubjectChaptersScreen subjectId={subject} data={data} />
}

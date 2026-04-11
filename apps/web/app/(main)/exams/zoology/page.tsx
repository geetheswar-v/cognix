import { SubjectChaptersScreen } from "@/components/main/subject-chapters-screen"
import type { SubjectChaptersResponse } from "@/components/main/types"
import { apiFetch } from "@/lib/server-api"

async function fetchData() {
  const response = await apiFetch("/api/tests/subjects/zoology/chapters")
  if (!response.ok) return null
  return (await response.json()) as SubjectChaptersResponse
}

export default async function ZoologyPage() {
  const data = await fetchData()
  return <SubjectChaptersScreen subjectId="zoology" data={data} />
}

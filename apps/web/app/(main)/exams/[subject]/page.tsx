import { notFound } from "next/navigation"

import { SubjectChapters } from "@/components/exams/subject-chapters"

const allowedSubjects = ["physics", "chemistry", "botany", "zoology"] as const

type SubjectType = (typeof allowedSubjects)[number]

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject } = await params

  if (!allowedSubjects.includes(subject as SubjectType)) {
    notFound()
  }

  return <SubjectChapters subject={subject as SubjectType} />
}

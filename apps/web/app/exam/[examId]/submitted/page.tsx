import { redirect } from "next/navigation"

import { ExamSubmitted } from "@/components/exam/exam-submitted"
import { getServerSession } from "@/lib/auth"

export default async function ExamSubmittedPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const { examId } = await params
  return <ExamSubmitted examId={examId} />
}

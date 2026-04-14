import { redirect } from "next/navigation"

import { ExamScreen } from "@/components/exam/exam-screen"
import { getServerSession } from "@/lib/auth"

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const { examId } = await params
  return <ExamScreen examId={examId} />
}

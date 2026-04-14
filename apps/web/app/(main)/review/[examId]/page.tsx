import { ExamReviewView } from "@/components/exam/exam-review"

export default async function ReviewExamPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {

  const { examId } = await params
  return <ExamReviewView examId={examId} />
}

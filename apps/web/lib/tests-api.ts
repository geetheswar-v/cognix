export type ExamType = "full" | "chapter"

export type ExamScoring = {
  correct: number
  wrong: number
  unattempted: number
}

export type ExamQuestionOption = {
  id: string
  optionIndex: number
  optionText: string
}

export type ExamQuestion = {
  id: string
  questionNumber: number
  subject: string
  chapter: string
  subTopic: string
  questionText: string
  explanation?: string
  options: ExamQuestionOption[]
}

export type ExamDetail = {
  id: string
  testId: string
  examType: ExamType
  subject: string | null
  chapter: string | null
  totalQuestions: number
  scoring: ExamScoring
  createdAt: string
}

export type LatestFullExam = {
  id: string
  externalTestId: string | null
  totalQuestions: number
  scoring: ExamScoring
  createdAt: string
}

export type LatestChapterTest = {
  testId: string
  examId: string
  subject: string | null
  chapter: string | null
  questions: number
  createdAt: string
}

export type ReviewAttempt = {
  attemptId: string
  examId: string
  testId: string | null
  examType: ExamType
  subject: string | null
  chapter: string | null
  questions: number
  score: number
  correctCount: number
  wrongCount: number
  unattemptedCount: number
  submittedAt: string | null
  createdAt: string
}

export type SubmitAnswerPayload = {
  questionId: string
  selectedOptionId: string | null
}

export type SubmitResult = {
  attemptId: string
  score: number
  correctCount: number
  wrongCount: number
  unattemptedCount: number
  totalQuestions: number
}

export type SubjectChapter = {
  chapter: string
  hasLatestTest: boolean
  latestTestId: string | null
  latestExamId: string | null
  latestCreatedAt: string | null
}

export type ReviewedQuestion = {
  id: string
  questionNumber: number
  questionText: string
  explanation: string
  selectedOptionId: string | null
  correctOptionId: string | null
  options: ExamQuestionOption[]
}

export type ExamReview = {
  success: true
  exam: {
    id: string
    testId: string
    examType?: ExamType
    subject: string | null
    chapter: string | null
    totalQuestions: number
  }
  attempt: {
    id: string
    submittedAt: string | null
    score: number
    correctCount: number
    wrongCount: number
    unattemptedCount: number
  }
  questions: ReviewedQuestion[]
}

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again."

function getErrorMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  if (!("success" in payload) || payload.success !== false) {
    return null
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }

  return FALLBACK_ERROR_MESSAGE
}

async function requestJson<T>(path: string, allowNotFound = false): Promise<T | null> {
  const response = await fetch(path, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  })

  if (allowNotFound && response.status === 404) {
    return null
  }

  const payload = (await response.json()) as unknown

  if (!response.ok || getErrorMessage(payload)) {
    const error = getErrorMessage(payload) ?? FALLBACK_ERROR_MESSAGE
    throw new Error(error || FALLBACK_ERROR_MESSAGE)
  }

  return payload as T
}

export async function fetchLatestFullNeet() {
  const payload = await requestJson<{
    success: true
    exam: LatestFullExam
    questions: ExamQuestion[]
  }>("/api/tests/latest-full-neet", true)

  return payload?.exam ?? null
}

export async function fetchLatestChapterTests(limit = 8) {
  const payload = await requestJson<{
    success: true
    exams: LatestChapterTest[]
  }>(`/api/tests/chapters/latest?limit=${limit}`)

  return payload?.exams ?? []
}

export async function fetchLatestReviewAttempts(limit = 8) {
  const payload = await requestJson<{
    success: true
    attempts: ReviewAttempt[]
  }>(`/api/tests/attempts/latest?limit=${limit}`)

  return payload?.attempts ?? []
}

export async function fetchSubjectChapters(subject: string) {
  const payload = await requestJson<{
    success: true
    subject: string
    chapters: SubjectChapter[]
  }>(`/api/tests/subjects/${subject}/chapters`)

  return payload?.chapters ?? []
}

export async function fetchExamById(examId: string) {
  const payload = await requestJson<{
    success: true
    exam: ExamDetail
    questions: ExamQuestion[]
  }>(`/api/tests/exams/${examId}`)

  if (!payload) {
    throw new Error("Exam not found")
  }

  return payload
}

export async function submitExam(examId: string, answers: SubmitAnswerPayload[]) {
  const response = await fetch(`/api/tests/${examId}/submit`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  })

  const payload = (await response.json()) as unknown

  if (!response.ok || getErrorMessage(payload)) {
    const error = getErrorMessage(payload) ?? FALLBACK_ERROR_MESSAGE
    throw new Error(error || FALLBACK_ERROR_MESSAGE)
  }

  return (payload as { success: true; result: SubmitResult }).result
}

export async function fetchExamReviewByExamId(examId: string) {
  const payload = await requestJson<ExamReview>(`/api/tests/exams/${examId}/review`)

  if (!payload) {
    throw new Error("Exam review not found")
  }

  return payload
}

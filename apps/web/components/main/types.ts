export type SubjectId = "physics" | "chemistry" | "botany" | "zoology"

export type SubjectExamMeta = {
  id: SubjectId
  label: string
  colorVar: string
}

export const SUBJECTS: Record<SubjectId, SubjectExamMeta> = {
  physics: { id: "physics", label: "Physics", colorVar: "var(--subject-physics)" },
  chemistry: { id: "chemistry", label: "Chemistry", colorVar: "var(--subject-chemistry)" },
  botany: { id: "botany", label: "Botany", colorVar: "var(--subject-botany)" },
  zoology: { id: "zoology", label: "Zoology", colorVar: "var(--subject-zoology)" },
}

export type LatestFullExamResponse = {
  success: boolean
  exam?: {
    id: string
    externalTestId: string | null
    totalQuestions: number
    scoring: {
      correct: number
      wrong: number
      unattempted: number
    }
    createdAt: string
  }
}

export type ChapterExamListResponse = {
  success: boolean
  exams: Array<{
    testId: string
    examId: string
    subject: string | null
    chapter: string | null
    questions: number
    createdAt: string
  }>
}

export type SubjectChaptersResponse = {
  success: boolean
  subject: SubjectId
  chapters: Array<{
    chapter: string
    hasLatestTest: boolean
    latestTestId: string | null
    latestExamId: string | null
    latestCreatedAt: string | null
  }>
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
  explanation: string
  options: ExamQuestionOption[]
}

export type ExamDetailsResponse = {
  success: boolean
  exam?: {
    id: string
    testId: string
    examType: string
    subject: string | null
    chapter: string | null
    totalQuestions: number
    scoring: {
      correct: number
      wrong: number
      unattempted: number
    }
    createdAt: string
  }
  questions?: ExamQuestion[]
}

export type ExamSubmitResponse = {
  success: boolean
  result?: {
    attemptId: string
    score: number
    correctCount: number
    wrongCount: number
    unattemptedCount: number
    totalQuestions: number
  }
  error?: string
}

export type ChapterReviewResponse = {
  success: boolean
  exam?: {
    id: string
    testId: string
    subject: string | null
    chapter: string | null
    totalQuestions: number
  }
  attempt?: {
    id: string
    submittedAt: string | null
    score: number
    correctCount: number
    wrongCount: number
    unattemptedCount: number
  }
  questions?: Array<{
    id: string
    questionNumber: number
    questionText: string
    explanation: string
    selectedOptionId: string | null
    correctOptionId: string | null
    options: ExamQuestionOption[]
  }>
}

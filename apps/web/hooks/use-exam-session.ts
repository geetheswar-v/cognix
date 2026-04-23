"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  fetchExamById,
  submitExam,
  type ExamQuestion,
  type SubmitResult,
} from "@/lib/tests-api"
import { useToast } from "@/components/ui/toast"

export type QuestionAttemptState = {
  selectedOptionId: string | null
  markedForReview: boolean
}

export type ExamQuestionStatus =
  | "answered"
  | "unanswered"
  | "marked-answered"
  | "marked-unanswered"

type SessionMap = Record<string, QuestionAttemptState>

type ExamSessionState = {
  exam: {
    id: string
    testId: string
    totalQuestions: number
    scoring: {
      correct: number
      wrong: number
      unattempted: number
    }
    subject: string | null
    chapter: string | null
    examType: "full" | "chapter"
  } | null
  questions: ExamQuestion[]
}

const INITIAL: ExamSessionState = {
  exam: null,
  questions: [],
}

function getStatus(item: QuestionAttemptState): ExamQuestionStatus {
  if (item.markedForReview && item.selectedOptionId) return "marked-answered"
  if (item.markedForReview && !item.selectedOptionId) return "marked-unanswered"
  if (item.selectedOptionId) return "answered"
  return "unanswered"
}

export function useExamSession(examId: string) {
  const { toast } = useToast()

  const [state, setState] = useState<ExamSessionState>(INITIAL)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attempts, setAttempts] = useState<SessionMap>({})

  const loadExam = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await fetchExamById(examId)
      setState({ exam: payload.exam, questions: payload.questions })

      const initialMap: SessionMap = {}
      payload.questions.forEach((question) => {
        initialMap[question.id] = {
          selectedOptionId: null,
          markedForReview: false,
        }
      })
      setAttempts(initialMap)
    } catch (error) {
      toast({
        kind: "error",
        title: "Unable to load exam",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [examId, toast])

  useEffect(() => {
    void loadExam()
  }, [loadExam])

  const statusByQuestionId = useMemo(() => {
    const map: Record<string, ExamQuestionStatus> = {}
    Object.entries(attempts).forEach(([questionId, item]) => {
      map[questionId] = getStatus(item)
    })
    return map
  }, [attempts])

  const counts = useMemo(() => {
    const result: Record<ExamQuestionStatus, number> = {
      answered: 0,
      unanswered: 0,
      "marked-answered": 0,
      "marked-unanswered": 0,
    }

    Object.values(attempts).forEach((item) => {
      result[getStatus(item)] += 1
    })

    return result
  }, [attempts])

  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAttempts((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        selectedOptionId: optionId,
      },
    }))
  }, [])

  const clearAnswer = useCallback((questionId: string) => {
    setAttempts((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        selectedOptionId: null,
      },
    }))
  }, [])

  const toggleMarkForReview = useCallback((questionId: string) => {
    setAttempts((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        markedForReview: !current[questionId]?.markedForReview,
      },
    }))
  }, [])

  const submit = useCallback(async (): Promise<SubmitResult> => {
    if (!state.exam || state.questions.length === 0) {
      throw new Error("Exam is not loaded")
    }

    setIsSubmitting(true)
    try {
      const payload = state.questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: attempts[question.id]?.selectedOptionId ?? null,
      }))

      return await submitExam(state.exam.id, payload)
    } catch (error) {
      toast({
        kind: "error",
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [attempts, state.exam, state.questions, toast])

  return {
    exam: state.exam,
    questions: state.questions,
    attempts,
    statusByQuestionId,
    counts,
    isLoading,
    isSubmitting,
    selectAnswer,
    clearAnswer,
    toggleMarkForReview,
    submit,
  }
}

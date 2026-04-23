"use client"

import { useCallback, useEffect, useState } from "react"

import {
  fetchLatestChapterTests,
  fetchLatestFullNeet,
  fetchLatestReviewAttempts,
  type LatestChapterTest,
  type LatestFullExam,
  type ReviewAttempt,
} from "@/lib/tests-api"
import { useToast } from "@/components/ui/toast"

type DashboardData = {
  latestFullExam: LatestFullExam | null
  chapterTests: LatestChapterTest[]
  reviewAttempts: ReviewAttempt[]
}

const INITIAL_STATE: DashboardData = {
  latestFullExam: null,
  chapterTests: [],
  reviewAttempts: [],
}

export function useDashboardData() {
  const { toast } = useToast()
  const [state, setState] = useState<DashboardData>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const [latestFullExam, chapterTests, reviewAttempts] = await Promise.all([
          fetchLatestFullNeet(),
          fetchLatestChapterTests(10),
          fetchLatestReviewAttempts(10),
        ])

        setState({
          latestFullExam,
          chapterTests,
          reviewAttempts,
        })
      } catch (error) {
        toast({
          kind: "error",
          title: "Could not load dashboard data",
          description:
            error instanceof Error
              ? error.message
              : "Please refresh and try again.",
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    void load()
  }, [load])

  return {
    ...state,
    isLoading,
    isRefreshing,
    refresh: () => load(true),
  }
}

import {
  IconArrowLeft,
  IconCheck,
  IconCircleDashed,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ReviewQuestion = {
  id: string
  questionNumber: number
  questionText: string
  explanation: string
  options: Array<{
    id: string
    optionIndex: number
    optionText: string
  }>
  selectedOptionId: string | null
  correctOptionId: string | null
}

type ExamReviewScreenProps = {
  title: string
  questions: ReviewQuestion[]
}

export function ExamReviewScreen({ title, questions }: ExamReviewScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription>
            Review each question to compare your selected option with the
            correct answer and explanation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted-foreground">
          <p>Total questions: {questions.length}</p>
          <Button render={<Link href="/exams" />} variant="outline" className="rounded-2xl">
            <IconArrowLeft data-icon="inline-start" />
            Back to Exams
          </Button>
        </CardContent>
      </Card>

      {questions.map((question) => (
        <Card
          key={question.id}
          className="rounded-3xl border border-border/70 bg-card/95 shadow-sm"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-foreground">
              Q{question.questionNumber}. {question.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {question.options.map((option) => {
              const isSelected = option.id === question.selectedOptionId
              const isCorrect = option.id === question.correctOptionId

              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-3",
                    isCorrect
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : isSelected
                        ? "border-destructive/40 bg-destructive/10 text-foreground"
                        : "border-border bg-background text-foreground"
                  )}
                >
                  <span className="mt-0.5">
                    {isCorrect ? (
                      <IconCheck className="size-4" />
                    ) : isSelected ? (
                      <IconX className="size-4" />
                    ) : (
                      <IconCircleDashed className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">
                      {String.fromCharCode(65 + option.optionIndex)}.
                    </span>{" "}
                    {option.optionText}
                  </p>
                </div>
              )
            })}
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
              <IconInfoCircle className="mr-1 inline" />
              <span className="font-medium text-foreground">Explanation: </span>
              {question.explanation}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center pb-8 pt-4">
        <Button
          render={<Link href="/" />}
          size="lg"
          className="rounded-2xl px-8"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

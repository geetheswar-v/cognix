import { IconCheck, IconX } from "@tabler/icons-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
      <Card className="rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-5 text-sm text-muted-foreground">
          Review mode shows your selected answers, correct options, and detailed explanations.
        </CardContent>
      </Card>

      {questions.map((question) => (
        <Card key={question.id} className="rounded-3xl border border-border/70 bg-card/95 py-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-foreground">
              Q{question.questionNumber}. {question.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-6">
            {question.options.map((option) => {
              const isSelected = option.id === question.selectedOptionId
              const isCorrect = option.id === question.correctOptionId

              return (
                <div
                  key={option.id}
                  className={
                    isCorrect
                      ? "flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-100/80 p-3 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300"
                      : isSelected
                        ? "flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-100/80 p-3 text-rose-900 dark:border-rose-700 dark:bg-rose-950/35 dark:text-rose-300"
                        : "flex items-start gap-2 rounded-xl border border-border/70 bg-background p-3 text-foreground"
                  }
                >
                  <span className="mt-0.5">
                    {isCorrect ? (
                      <IconCheck className="size-4" />
                    ) : isSelected ? (
                      <IconX className="size-4" />
                    ) : (
                      <span className="inline-block size-4" />
                    )}
                  </span>
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">{String.fromCharCode(65 + option.optionIndex)}.</span>{" "}
                    {option.optionText}
                  </p>
                </div>
              )
            })}
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Explanation: </span>
              {question.explanation}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

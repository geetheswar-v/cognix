import { Elysia, t } from 'elysia';
import { auth } from '../../lib/auth';
import { getLatestCompletedExamWithQuestions, submitNeetExamAnswers } from '../../lib/neet';

export const testsRoutes = new Elysia({ prefix: '/tests' })
  .get('/latest-full-neet', async ({ set }) => {
    const latest = await getLatestCompletedExamWithQuestions();

    if (!latest) {
      set.status = 404;
      return {
        success: false,
        error: 'No completed NEET exam available yet.',
      };
    }

    return {
      success: true,
      exam: {
        id: latest.exam.id,
        externalTestId: latest.exam.externalTestId,
        totalQuestions: latest.exam.totalQuestions,
        scoring: {
          correct: latest.exam.scoringCorrectMarks,
          wrong: latest.exam.scoringWrongMarks,
          unattempted: latest.exam.scoringUnattemptedMarks,
        },
        createdAt: latest.exam.createdAt,
      },
      questions: latest.questions.map((question) => ({
        id: question.id,
        questionNumber: question.questionNumber,
        subject: question.subject,
        chapter: question.chapter,
        subTopic: question.subTopic,
        questionText: question.questionText,
        options: question.options.map((option) => ({
          id: option.id,
          optionIndex: option.optionIndex,
          optionText: option.optionText,
        })),
      })),
    };
  })
  .post(
    '/:examId/submit',
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        set.status = 401;
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      try {
        const result = await submitNeetExamAnswers({
          examId: params.examId,
          userId: session.user.id,
          answers: body.answers,
        });

        return {
          success: true,
          result,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to submit exam',
        };
      }
    },
    {
      params: t.Object({
        examId: t.String(),
      }),
      body: t.Object({
        answers: t.Array(
          t.Object({
            questionId: t.String(),
            selectedOptionId: t.Nullable(t.String()),
          }),
        ),
      }),
    },
  );

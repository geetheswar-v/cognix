import { Elysia, t } from 'elysia';
import { auth } from '../../lib/auth';
import {
  getCompletedExamWithQuestionsByExamId,
  getAttemptedExamReviewByExamId,
  getAttemptedChapterTestReview,
  getChapterExamByTestId,
  getLatestCompletedChapterExams,
  getLatestCompletedExamWithQuestions,
  getLatestAttemptedExams,
  getSubjectChaptersWithLatestTest,
  submitNeetExamAnswers,
} from '../../lib/neet';

export const testsRoutes = new Elysia({ prefix: '/tests' })
  .onBeforeHandle(async ({ request, set }) => {
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
  })
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
  .get('/chapters/latest', async ({ query }) => {
    const exams = await getLatestCompletedChapterExams(query.limit ?? 20);
    return {
      success: true,
      exams,
    };
  }, {
    query: t.Object({
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
    }),
  })
  .get('/attempts/latest', async ({ query, request, set }) => {
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

    const attempts = await getLatestAttemptedExams({
      userId: session.user.id,
      limit: query.limit ?? 20,
    });

    return {
      success: true,
      attempts,
    };
  }, {
    query: t.Object({
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
    }),
  })
  .get('/subjects/:subject/chapters', async ({ params, set }) => {
    const normalized = params.subject.toLowerCase();
    if (!['physics', 'chemistry', 'botany', 'zoology'].includes(normalized)) {
      set.status = 400;
      return {
        success: false,
        error: 'Invalid subject',
      };
    }

    const chapters = await getSubjectChaptersWithLatestTest(normalized);
    return {
      success: true,
      subject: normalized,
      chapters,
    };
  }, {
    params: t.Object({
      subject: t.String(),
    }),
  })
  .get('/chapters/:testId', async ({ params, set }) => {
    const found = await getChapterExamByTestId(params.testId);

    if (!found) {
      set.status = 404;
      return {
        success: false,
        error: 'Chapter test not found',
      };
    }

    return {
      success: true,
      exam: {
        id: found.exam.id,
        testId: found.exam.externalTestId ?? found.exam.id,
        examType: found.exam.examType,
        subject: found.exam.scopeSubject,
        chapter: found.exam.scopeChapter,
        totalQuestions: found.exam.totalQuestions,
        scoring: {
          correct: found.exam.scoringCorrectMarks,
          wrong: found.exam.scoringWrongMarks,
          unattempted: found.exam.scoringUnattemptedMarks,
        },
        createdAt: found.exam.createdAt,
      },
      questions: found.questions.map((question) => ({
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
  }, {
    params: t.Object({
      testId: t.String(),
    }),
  })
  .get('/chapters/:testId/review', async ({ params, request, set }) => {
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

    const review = await getAttemptedChapterTestReview({
      userId: session.user.id,
      testId: params.testId,
    });

    if (!review) {
      set.status = 404;
      return {
        success: false,
        error: 'Attempt not found for this chapter test',
      };
    }

    return {
      success: true,
      exam: {
        id: review.exam.id,
        testId: review.exam.externalTestId ?? review.exam.id,
        subject: review.exam.scopeSubject,
        chapter: review.exam.scopeChapter,
        totalQuestions: review.exam.totalQuestions,
      },
      attempt: {
        id: review.attempt.id,
        submittedAt: review.attempt.submittedAt,
        score: review.attempt.score,
        correctCount: review.attempt.correctCount,
        wrongCount: review.attempt.wrongCount,
        unattemptedCount: review.attempt.unattemptedCount,
      },
      questions: review.questions,
    };
  }, {
    params: t.Object({
      testId: t.String(),
    }),
  })
  .get('/exams/:examId/review', async ({ params, request, set }) => {
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

    const review = await getAttemptedExamReviewByExamId({
      userId: session.user.id,
      examId: params.examId,
    });

    if (!review) {
      set.status = 404;
      return {
        success: false,
        error: 'Attempt not found for this exam',
      };
    }

    return {
      success: true,
      exam: {
        id: review.exam.id,
        testId: review.exam.externalTestId ?? review.exam.id,
        examType: review.exam.examType,
        subject: review.exam.scopeSubject,
        chapter: review.exam.scopeChapter,
        totalQuestions: review.exam.totalQuestions,
      },
      attempt: {
        id: review.attempt.id,
        submittedAt: review.attempt.submittedAt,
        score: review.attempt.score,
        correctCount: review.attempt.correctCount,
        wrongCount: review.attempt.wrongCount,
        unattemptedCount: review.attempt.unattemptedCount,
      },
      questions: review.questions,
    };
  }, {
    params: t.Object({
      examId: t.String(),
    }),
  })
  .get('/exams/:examId', async ({ params, set }) => {
    const found = await getCompletedExamWithQuestionsByExamId(params.examId);

    if (!found) {
      set.status = 404;
      return {
        success: false,
        error: 'Exam not found',
      };
    }

    return {
      success: true,
      exam: {
        id: found.exam.id,
        testId: found.exam.externalTestId ?? found.exam.id,
        examType: found.exam.examType,
        subject: found.exam.scopeSubject,
        chapter: found.exam.scopeChapter,
        totalQuestions: found.exam.totalQuestions,
        scoring: {
          correct: found.exam.scoringCorrectMarks,
          wrong: found.exam.scoringWrongMarks,
          unattempted: found.exam.scoringUnattemptedMarks,
        },
        createdAt: found.exam.createdAt,
      },
      questions: found.questions.map((question) => ({
        id: question.id,
        questionNumber: question.questionNumber,
        subject: question.subject,
        chapter: question.chapter,
        subTopic: question.subTopic,
        questionText: question.questionText,
        explanation: question.explanation,
        options: question.options.map((option) => ({
          id: option.id,
          optionIndex: option.optionIndex,
          optionText: option.optionText,
        })),
      })),
    };
  }, {
    params: t.Object({
      examId: t.String(),
    }),
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

import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const neetExam = pgTable("neet_exam", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  externalTestId: text("external_test_id"),
  examType: text("exam_type").notNull().default("full"),
  scopeSubject: text("scope_subject"),
  scopeChapter: text("scope_chapter"),
  status: text("status").notNull().default("queued"),
  totalQuestions: integer("total_questions").notNull().default(180),
  scoringCorrectMarks: integer("scoring_correct_marks").notNull().default(4),
  scoringWrongMarks: integer("scoring_wrong_marks").notNull().default(-1),
  scoringUnattemptedMarks: integer("scoring_unattempted_marks").notNull().default(0),
  blueprintVersion: text("blueprint_version"),
  failureReason: text("failure_reason"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
},
  (table) => [
    index("neet_exam_exam_type_idx").on(table.examType),
    index("neet_exam_scope_subject_idx").on(table.scopeSubject),
    index("neet_exam_scope_chapter_idx").on(table.scopeChapter),
  ]);

export const neetExamQuestion = pgTable(
  "neet_exam_question",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => neetExam.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    subject: text("subject").notNull(),
    chapter: text("chapter").notNull(),
    subTopic: text("sub_topic").notNull(),
    questionText: text("question_text").notNull(),
    explanation: text("explanation").notNull(),
    difficulty: text("difficulty"),
    sourceConceptId: integer("source_concept_id"),
    sourceConceptHash: text("source_concept_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("neet_exam_question_exam_number_uidx").on(table.examId, table.questionNumber),
    index("neet_exam_question_exam_id_idx").on(table.examId),
    index("neet_exam_question_subject_idx").on(table.subject),
    index("neet_exam_question_chapter_idx").on(table.chapter),
    index("neet_exam_question_sub_topic_idx").on(table.subTopic),
  ],
);

export const neetExamOption = pgTable(
  "neet_exam_option",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => neetExamQuestion.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("neet_exam_option_question_option_uidx").on(table.questionId, table.optionIndex),
    index("neet_exam_option_question_id_idx").on(table.questionId),
  ],
);

export const neetExamAttempt = pgTable(
  "neet_exam_attempt",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => neetExam.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at"),
    score: integer("score").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    unattemptedCount: integer("unattempted_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("neet_exam_attempt_exam_user_uidx").on(table.examId, table.userId),
    index("neet_exam_attempt_exam_id_idx").on(table.examId),
    index("neet_exam_attempt_user_id_idx").on(table.userId),
  ],
);

export const neetExamAttemptAnswer = pgTable(
  "neet_exam_attempt_answer",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => neetExamAttempt.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => neetExamQuestion.id, { onDelete: "cascade" }),
    selectedOptionId: text("selected_option_id").references(() => neetExamOption.id, {
      onDelete: "set null",
    }),
    isCorrect: boolean("is_correct"),
    marksAwarded: integer("marks_awarded").notNull().default(0),
    subject: text("subject").notNull(),
    chapter: text("chapter").notNull(),
    subTopic: text("sub_topic").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("neet_exam_attempt_answer_attempt_question_uidx").on(table.attemptId, table.questionId),
    index("neet_exam_attempt_answer_attempt_id_idx").on(table.attemptId),
    index("neet_exam_attempt_answer_question_id_idx").on(table.questionId),
    index("neet_exam_attempt_answer_subject_idx").on(table.subject),
    index("neet_exam_attempt_answer_chapter_idx").on(table.chapter),
    index("neet_exam_attempt_answer_sub_topic_idx").on(table.subTopic),
  ],
);

export const neetExamRelations = relations(neetExam, ({ many }) => ({
  questions: many(neetExamQuestion),
  attempts: many(neetExamAttempt),
}));

export const neetExamQuestionRelations = relations(neetExamQuestion, ({ one, many }) => ({
  exam: one(neetExam, {
    fields: [neetExamQuestion.examId],
    references: [neetExam.id],
  }),
  options: many(neetExamOption),
  answers: many(neetExamAttemptAnswer),
}));

export const neetExamOptionRelations = relations(neetExamOption, ({ one, many }) => ({
  question: one(neetExamQuestion, {
    fields: [neetExamOption.questionId],
    references: [neetExamQuestion.id],
  }),
  selectedByAnswers: many(neetExamAttemptAnswer),
}));

export const neetExamAttemptRelations = relations(neetExamAttempt, ({ one, many }) => ({
  exam: one(neetExam, {
    fields: [neetExamAttempt.examId],
    references: [neetExam.id],
  }),
  user: one(user, {
    fields: [neetExamAttempt.userId],
    references: [user.id],
  }),
  answers: many(neetExamAttemptAnswer),
}));

export const neetExamAttemptAnswerRelations = relations(neetExamAttemptAnswer, ({ one }) => ({
  attempt: one(neetExamAttempt, {
    fields: [neetExamAttemptAnswer.attemptId],
    references: [neetExamAttempt.id],
  }),
  question: one(neetExamQuestion, {
    fields: [neetExamAttemptAnswer.questionId],
    references: [neetExamQuestion.id],
  }),
  selectedOption: one(neetExamOption, {
    fields: [neetExamAttemptAnswer.selectedOptionId],
    references: [neetExamOption.id],
  }),
}));

CREATE TABLE "neet_exam" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"external_test_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"total_questions" integer DEFAULT 180 NOT NULL,
	"scoring_correct_marks" integer DEFAULT 4 NOT NULL,
	"scoring_wrong_marks" integer DEFAULT -1 NOT NULL,
	"scoring_unattempted_marks" integer DEFAULT 0 NOT NULL,
	"blueprint_version" text,
	"failure_reason" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "neet_exam_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "neet_exam_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"unattempted_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neet_exam_attempt_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option_id" text,
	"is_correct" boolean,
	"marks_awarded" integer DEFAULT 0 NOT NULL,
	"subject" text NOT NULL,
	"chapter" text NOT NULL,
	"sub_topic" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neet_exam_option" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"option_index" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neet_exam_question" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"question_number" integer NOT NULL,
	"subject" text NOT NULL,
	"chapter" text NOT NULL,
	"sub_topic" text NOT NULL,
	"question_text" text NOT NULL,
	"explanation" text NOT NULL,
	"difficulty" text,
	"source_concept_id" integer,
	"source_concept_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "neet_exam_attempt" ADD CONSTRAINT "neet_exam_attempt_exam_id_neet_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."neet_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_attempt" ADD CONSTRAINT "neet_exam_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_attempt_answer" ADD CONSTRAINT "neet_exam_attempt_answer_attempt_id_neet_exam_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."neet_exam_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_attempt_answer" ADD CONSTRAINT "neet_exam_attempt_answer_question_id_neet_exam_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."neet_exam_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_attempt_answer" ADD CONSTRAINT "neet_exam_attempt_answer_selected_option_id_neet_exam_option_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."neet_exam_option"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_option" ADD CONSTRAINT "neet_exam_option_question_id_neet_exam_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."neet_exam_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neet_exam_question" ADD CONSTRAINT "neet_exam_question_exam_id_neet_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."neet_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "neet_exam_attempt_exam_user_uidx" ON "neet_exam_attempt" USING btree ("exam_id","user_id");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_exam_id_idx" ON "neet_exam_attempt" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_user_id_idx" ON "neet_exam_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neet_exam_attempt_answer_attempt_question_uidx" ON "neet_exam_attempt_answer" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_answer_attempt_id_idx" ON "neet_exam_attempt_answer" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_answer_question_id_idx" ON "neet_exam_attempt_answer" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_answer_subject_idx" ON "neet_exam_attempt_answer" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_answer_chapter_idx" ON "neet_exam_attempt_answer" USING btree ("chapter");--> statement-breakpoint
CREATE INDEX "neet_exam_attempt_answer_sub_topic_idx" ON "neet_exam_attempt_answer" USING btree ("sub_topic");--> statement-breakpoint
CREATE UNIQUE INDEX "neet_exam_option_question_option_uidx" ON "neet_exam_option" USING btree ("question_id","option_index");--> statement-breakpoint
CREATE INDEX "neet_exam_option_question_id_idx" ON "neet_exam_option" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neet_exam_question_exam_number_uidx" ON "neet_exam_question" USING btree ("exam_id","question_number");--> statement-breakpoint
CREATE INDEX "neet_exam_question_exam_id_idx" ON "neet_exam_question" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "neet_exam_question_subject_idx" ON "neet_exam_question" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "neet_exam_question_chapter_idx" ON "neet_exam_question" USING btree ("chapter");--> statement-breakpoint
CREATE INDEX "neet_exam_question_sub_topic_idx" ON "neet_exam_question" USING btree ("sub_topic");
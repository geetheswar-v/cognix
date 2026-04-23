ALTER TABLE "neet_exam" ADD COLUMN "exam_type" text DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "neet_exam" ADD COLUMN "scope_subject" text;--> statement-breakpoint
ALTER TABLE "neet_exam" ADD COLUMN "scope_chapter" text;--> statement-breakpoint
CREATE INDEX "neet_exam_exam_type_idx" ON "neet_exam" USING btree ("exam_type");--> statement-breakpoint
CREATE INDEX "neet_exam_scope_subject_idx" ON "neet_exam" USING btree ("scope_subject");--> statement-breakpoint
CREATE INDEX "neet_exam_scope_chapter_idx" ON "neet_exam" USING btree ("scope_chapter");